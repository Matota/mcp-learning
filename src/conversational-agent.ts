
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not set in environment variables.");
    process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function main() {
    // 1. Initialize MCP Client
    const transport = new StdioClientTransport({
        command: "node",
        args: ["--loader", "ts-node/esm", "--no-warnings", "src/server-stdio.ts"]
    });

    const mcpClient = new Client(
        { name: "conversational-agent", version: "1.0.0" },
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
                parameters: tool.inputSchema as any
            }
        }));

        // 4. Initialize conversation history
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: "system", content: "You are a helpful assistant with access to tools. Be concise and friendly." }
        ];

        // 5. Create readline interface for interactive chat
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\n[Agent] Ready! Type your questions or '/quit' to exit.\n");

        // 6. Conversational loop
        const askQuestion = () => {
            rl.question("You: ", async (userInput) => {
                if (!userInput.trim()) {
                    askQuestion();
                    return;
                }

                if (userInput.trim().toLowerCase() === "/quit") {
                    console.log("[Agent] Goodbye!");
                    rl.close();
                    await mcpClient.close();
                    process.exit(0);
                }

                // Add user message to history
                messages.push({ role: "user", content: userInput });

                try {
                    // Call LLM
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: messages,
                        tools: openaiTools,
                        tool_choice: "auto"
                    });

                    const choice = response.choices[0];
                    const message = choice.message;

                    // Handle tool calls
                    if (message.tool_calls) {
                        messages.push(message); // Add assistant's tool request

                        for (const toolCall of message.tool_calls) {
                            // @ts-ignore
                            const toolName = toolCall.function.name;
                            // @ts-ignore
                            const toolArgs = JSON.parse(toolCall.function.arguments);

                            // Call MCP Tool
                            const result = await mcpClient.callTool({
                                name: toolName,
                                arguments: toolArgs
                            });

                            // @ts-ignore
                            const toolResultText = result.content.map(c => c.text).join("\n");

                            // Add result to messages
                            messages.push({
                                role: "tool",
                                tool_call_id: toolCall.id,
                                content: toolResultText
                            });
                        }

                        // Get final response after tool execution
                        const finalResponse = await openai.chat.completions.create({
                            model: "gpt-4o",
                            messages: messages,
                        });

                        const finalMessage = finalResponse.choices[0].message;
                        messages.push(finalMessage); // Add to history
                        console.log(`Agent: ${finalMessage.content}\n`);

                    } else {
                        // No tool calls, just add response to history
                        messages.push(message);
                        console.log(`Agent: ${message.content}\n`);
                    }

                } catch (error) {
                    console.error("[Agent] Error:", error instanceof Error ? error.message : error);
                }

                // Continue the loop
                askQuestion();
            });
        };

        // Start the conversation
        askQuestion();

    } catch (error) {
        console.error("[Agent] Critical Error:", error);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("Critical Agent Error:", err);
    process.exit(1);
});
