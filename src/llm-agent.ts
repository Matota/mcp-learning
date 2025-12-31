
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not set in environment variables.");
    process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function main() {
    const userQuery = process.argv[2];
    if (!userQuery) {
        console.log("Usage: node --loader ts-node/esm --no-warnings src/llm-agent.ts \"<question>\"");
        process.exit(1);
    }

    // 1. Initialize MCP Client
    const transport = new StdioClientTransport({
        command: "node",
        args: ["--loader", "ts-node/esm", "--no-warnings", "src/server-stdio.ts"]
    });

    const mcpClient = new Client(
        { name: "llm-agent", version: "1.0.0" },
        { capabilities: {} }
    );

    try {
        await mcpClient.connect(transport);
        console.log("[Agent] Connected to MCP Server.");

        // 2. Discover Tools
        const toolsList = await mcpClient.listTools();
        const mcpTools = toolsList.tools;
        console.log(`[Agent] Discovered ${mcpTools.length} tools: ${mcpTools.map(t => t.name).join(", ")}`);

        // 3. Convert Tools to OpenAI Format
        const openaiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = mcpTools.map(tool => ({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema as any // Zod schema is JSON Schema compatible
            }
        }));

        // 4. Initial LLM Call
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: "system", content: "You are a helpful assistant with access to tools." },
            { role: "user", content: userQuery }
        ];

        console.log("[Agent] Thinking...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Or gpt-3.5-turbo
            messages: messages,
            tools: openaiTools,
            tool_choice: "auto"
        });

        const choice = response.choices[0];
        const message = choice.message;

        // 5. Handle Tool Calls
        if (message.tool_calls) {
            console.log(`[Agent] LLM wants to call ${message.tool_calls.length} tool(s).`);
            messages.push(message); // Add assistant's tool request to history

            for (const toolCall of message.tool_calls) {
                // @ts-ignore
                const toolName = toolCall.function.name;
                // @ts-ignore
                const toolArgs = JSON.parse(toolCall.function.arguments);

                console.log(`[Agent] Executing tool '${toolName}' with args:`, toolArgs);

                // Call MCP Tool
                const result = await mcpClient.callTool({
                    name: toolName,
                    arguments: toolArgs
                });

                // Helper to extract text from content
                // @ts-ignore
                const toolResultText = result.content.map(c => c.text).join("\n");

                console.log(`[Agent] Tool Result: ${toolResultText}`);

                // Add result to messages
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: toolResultText
                });
            }

            // 6. Follow-up LLM Call (to interpret result)
            console.log("[Agent] Synthesizing final answer...");
            const finalResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: messages,
            });

            console.log("\n[Agent] Final Answer:\n" + finalResponse.choices[0].message.content);

        } else {
            console.log("\n[Agent] Final Answer:\n" + message.content);
        }

    } catch (error) {
        console.error("[Agent] Error:", error);
    } finally {
        await mcpClient.close();
    }
}

main().catch((err) => {
    console.error("Critical Agent Error:", err);
    process.exit(1);
});
