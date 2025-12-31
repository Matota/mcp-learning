
import { ResearcherAgent, WeatherAgent } from "./worker-agents.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runHeartbeat() {
    console.log("[Heartbeat] Starting Worker Connection Test...");

    const researcher = new ResearcherAgent();
    const weatherExpert = new WeatherAgent();

    try {
        // 1. Initialize Workers
        console.log("[Heartbeat] Initializing Researcher (Document Server)...");
        await researcher.initialize(new StdioClientTransport({
            command: "node",
            args: ["--loader", "ts-node/esm", "--no-warnings", "src/document-server.ts"]
        }));

        console.log("[Heartbeat] Initializing Weather Expert (Weather Server)...");
        await weatherExpert.initialize(new StdioClientTransport({
            command: "node",
            args: ["--loader", "ts-node/esm", "--no-warnings", "src/server-stdio.ts"]
        }));

        // 2. Direct Worker Calls (No LLM required)
        console.log("\n--- Testing Researcher Worker ---");
        const researchResult = await researcher.execute("Japan");
        console.log("Result:", researchResult);

        console.log("\n--- Testing Weather Expert Worker ---");
        const weatherResult = await weatherExpert.execute("Tokyo");
        console.log("Result:", weatherResult);

        // 3. Cleanup
        await researcher.close();
        await weatherExpert.close();

        console.log("\n[Heartbeat] SUCCESS: All workers are connected and responding correctly via MCP.");
        process.exit(0);

    } catch (error) {
        console.error("[Heartbeat] FAILED:", error);
        process.exit(1);
    }
}

runHeartbeat();
