
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChatOpenAI } from "@langchain/openai";
import {
    StateGraph,
    START,
    END,
    MessagesAnnotation,
    Annotation
} from "@langchain/langgraph";
import { Tool } from "@langchain/core/tools";
import { BaseMessage, AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not set in environment variables.");
    process.exit(1);
}

// 1. Define the State
const GraphState = Annotation.Root({
    ...MessagesAnnotation.spec,
    // We can add custom state here if needed
});

// 2. Wrap MCP Tools as LangChain Tools
class McpTool extends Tool {
    name: string;
    description: string;
    private client: Client;
    private toolName: string;

    constructor(name: string, description: string, client: Client, toolName: string) {
        super();
        this.name = name;
        this.description = description;
        this.client = client;
        this.toolName = toolName;
    }

    async _call(input: string): Promise<string> {
        try {
            // MCP tools usually take objects. For simplicity, we assume the LLM passes JSON or we parse it.
            let args = {};
            try {
                args = JSON.parse(input);
            } catch {
                // If it's just a string (like a city name), wrap it
                if (this.toolName === "get_weather") args = { city: input };
                else if (this.toolName === "search_documents") args = { query: input };
            }

            const result = await this.client.callTool({
                name: this.toolName,
                arguments: args
            });

            // @ts-ignore
            return result.content.map(c => c.text).join("\n");
        } catch (error) {
            return `Error calling ${this.toolName}: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}

export class LangGraphAgent {
    private weatherClient: Client;
    private documentClient: Client;
    private model: ChatOpenAI;
    private tools: McpTool[] = [];
    private graph: any;

    constructor() {
        this.weatherClient = new Client(
            { name: "weather-worker", version: "1.0.0" },
            { capabilities: {} }
        );
        this.documentClient = new Client(
            { name: "document-worker", version: "1.0.0" },
            { capabilities: {} }
        );
        this.model = new ChatOpenAI({
            modelName: "gpt-4o",
            temperature: 0,
        });
    }

    async initialize() {
        // Connect to MCP servers
        await this.weatherClient.connect(new StdioClientTransport({
            command: "node",
            args: ["--loader", "ts-node/esm", "--no-warnings", "src/server-stdio.ts"]
        }));

        await this.documentClient.connect(new StdioClientTransport({
            command: "node",
            args: ["--loader", "ts-node/esm", "--no-warnings", "src/document-server.ts"]
        }));

        // Discover and wrap tools
        const weatherTools = await this.weatherClient.listTools();
        const documentTools = await this.documentClient.listTools();

        this.tools = [
            ...weatherTools.tools.map(t => new McpTool(t.name, t.description || "", this.weatherClient, t.name)),
            ...documentTools.tools.map(t => new McpTool(t.name, t.description || "", this.documentClient, t.name))
        ];

        // Bind tools to model
        const modelWithTools = this.model.bindTools(this.tools);

        // 3. Define Graph Nodes
        const callModel = async (state: typeof GraphState.State) => {
            const response = await modelWithTools.invoke(state.messages);
            return { messages: [response] };
        };

        const callTool = async (state: typeof GraphState.State) => {
            const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
            const toolCalls = lastMessage.tool_calls || [];
            const toolMessages: ToolMessage[] = [];

            for (const call of toolCalls) {
                const tool = this.tools.find(t => t.name === call.name);
                if (tool) {
                    const result = await tool._call(JSON.stringify(call.args));
                    toolMessages.push(new ToolMessage({
                        tool_call_id: call.id!,
                        content: result,
                    }));
                }
            }

            return { messages: toolMessages };
        };

        const shouldContinue = (state: typeof GraphState.State) => {
            const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
            if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
                return "tools";
            }
            return END;
        };

        // 4. Build the Graph
        const workflow = new StateGraph(GraphState)
            .addNode("agent", callModel)
            .addNode("tools", callTool)
            .addEdge(START, "agent")
            .addConditionalEdges("agent", shouldContinue)
            .addEdge("tools", "agent");

        this.graph = workflow.compile();
        console.log("[LangGraph] Agent Graph initialized and compiled.");
    }

    async run(input: string) {
        const initialState = {
            messages: [new HumanMessage(input)]
        };

        const result = await this.graph.invoke(initialState);
        const lastMessage = result.messages[result.messages.length - 1];
        return lastMessage.content;
    }

    async close() {
        await this.weatherClient.close();
        await this.documentClient.close();
    }
}
