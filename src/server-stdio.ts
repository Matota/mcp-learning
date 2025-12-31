
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./weather-server.js";

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server running on Stdio");
}

main().catch((err) => {
    console.error("Server error:", err);
    process.exit(1);
});
