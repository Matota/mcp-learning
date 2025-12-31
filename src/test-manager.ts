
import { ManagerAgent } from "./manager-agent.js";

async function runTest() {
    const manager = new ManagerAgent();

    try {
        console.log("[Test] Initializing Manager...");
        await manager.initialize();

        const query = "What is the capital of Japan and what is the weather like there today? Please summarize it in a friendly tone.";
        console.log(`[Test] Running Query: "${query}"`);

        const response = await manager.processRequest(query);

        console.log("\n--- FINAL AGENT RESPONSE ---");
        console.log(response);
        console.log("----------------------------\n");

        await manager.close();
        console.log("[Test] Verification complete.");
        process.exit(0);

    } catch (error) {
        console.error("[Test] Error during verification:", error);
        process.exit(1);
    }
}

runTest();
