
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "./weather-server.js";

const app = express();
const transports = new Map<string, SSEServerTransport>();

app.get("/sse", async (req, res) => {
    console.log("New SSE connection...");
    const transport = new SSEServerTransport("/messages", res);
    console.log("Created transport with sessionId:", transport.sessionId);
    transports.set(transport.sessionId, transport);

    transport.onclose = () => {
        console.log("SSE connection closed", transport.sessionId);
        transports.delete(transport.sessionId);
    };

    await server.connect(transport);
});

app.post("/messages", async (req, res) => {
    console.log("Received message on /messages");
    const sessionId = req.query.sessionId as string;
    console.log("Query sessionId:", sessionId);
    const transport = transports.get(sessionId);

    if (!transport) {
        console.log("Session not found. Available sessions:", Array.from(transports.keys()));
        res.status(404).send("Session not found");
        return;
    }

    await transport.handlePostMessage(req, res);
});

const PORT = 3001;
const serverInstance = app.listen(PORT, () => {
    console.log(`SSE Server running on http://localhost:${PORT}/sse`);
});

serverInstance.on('error', (err) => {
    console.error("Server failed to start:", err);
    process.exit(1);
});
