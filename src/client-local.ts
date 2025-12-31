
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    const transport = new StdioClientTransport({
        command: "node",
        args: ["--loader", "ts-node/esm", "--no-warnings", "src/server-stdio.ts"]
    });

    const client = new Client(
        { name: "weather-client", version: "1.0.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    console.log("Connected to server!");

    const result = await client.callTool({
        name: "get_weather",
        arguments: { city: "San Francisco" }
    });

    console.log("Tool result:", result);
    await client.close();
}

main().catch((err) => {
    console.error("Client error:", err);
    process.exit(1);
});
