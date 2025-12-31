
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    // 1. Get user input from command line arguments
    const userInput = process.argv[2];
    if (!userInput) {
        console.log("Usage: node --loader ts-node/esm --no-warnings src/reflex-agent.ts \"<question>\"");
        process.exit(1);
    }

    console.log(`[Agent] Listening... User said: "${userInput}"`);

    // 2. "Brain": Use Regex to find intents
    // Pattern: Look for "weather" and strict "in <City>"
    const weatherPattern = /(?:weather|temperature).*in\s+(\w+)/i;
    const match = userInput.match(weatherPattern);

    if (match) {
        const city = match[1];
        console.log(`[Agent] Pattern matched! Intent: GetWeather, Entity: ${city}`);

        // 3. "Action": Call the tool
        console.log(`[Agent] Calling Tool 'get_weather'...`);

        // Setup Transport
        const transport = new StdioClientTransport({
            command: "node",
            args: ["--loader", "ts-node/esm", "--no-warnings", "src/server-stdio.ts"]
        });

        // Setup Client
        const client = new Client(
            { name: "reflex-agent", version: "1.0.0" },
            { capabilities: {} }
        );

        try {
            await client.connect(transport);

            // Call Tool
            const result = await client.callTool({
                name: "get_weather",
                arguments: { city: city }
            });

            // 4. "Output": Format result for user
            // @ts-ignore
            const weatherText = result.content[0].text;
            console.log(`[Agent] Final Answer: The tool says: ${weatherText}`);

        } catch (error) {
            console.error("[Agent] Failed to call tool:", error);
        } finally {
            await client.close();
        }

    } else {
        console.log(`[Agent] I didn't understand that. I am a simple Reflex Agent. Try asking: "What is the weather in Paris?"`);
    }
}

main().catch((err) => {
    console.error("Agent critical error:", err);
    process.exit(1);
});
