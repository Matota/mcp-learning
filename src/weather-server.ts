
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const server = new McpServer({
    name: "weather-server",
    version: "1.0.0"
});

server.tool(
    "get_weather",
    { city: z.string() },
    async ({ city }) => {
        return {
            content: [{ type: "text", text: `Weather in ${city}: Sunny, 25°C` }]
        };
    }
);
