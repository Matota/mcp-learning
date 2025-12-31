
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { URL } from "url";

async function main() {
    const url = new URL("http://localhost:3001/sse");
    const transport = new SSEClientTransport(url);

    const client = new Client(
        { name: "weather-client-remote", version: "1.0.0" },
        { capabilities: {} }
    );

    console.log("Connecting to server...");
    await client.connect(transport);
    console.log("Connected to server!");

    const result = await client.callTool({
        name: "get_weather",
        arguments: { city: "London" }
    });

    console.log("Tool result:", result);
    await client.close();
}

main().catch((err) => {
    console.error("Client error:", err);
    process.exit(1);
});
