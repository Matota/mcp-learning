
import { LangGraphAgent } from "./langgraph-agent.js";
import * as readline from "readline";

async function main() {
    const agent = new LangGraphAgent();

    try {
        await agent.initialize();

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\n[LangGraph Agent] Ready! Type your interactive requests or '/quit' to exit.\n");

        const askQuestion = () => {
            rl.question("You: ", async (userInput) => {
                if (!userInput.trim()) {
                    askQuestion();
                    return;
                }

                if (userInput.trim().toLowerCase() === "/quit") {
                    console.log("[LangGraph Agent] Shutting down...");
                    rl.close();
                    await agent.close();
                    process.exit(0);
                }

                try {
                    console.log("[LangGraph Agent] Thinking...");
                    const response = await agent.run(userInput);
                    console.log(`\nAgent: ${response}\n`);
                } catch (error) {
                    console.error("[LangGraph Agent] Error:", error instanceof Error ? error.message : error);
                }

                askQuestion();
            });
        };

        askQuestion();

    } catch (error) {
        console.error("[LangGraph Agent] Critical Error during initialization:", error);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
