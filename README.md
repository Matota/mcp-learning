# MCP Learning Project

This project demonstrates how to build a Model Context Protocol (MCP) Server and Client, and connect them using both Local (Stdio) and Remote (SSE/HTTP) transports.

## Components

1.  **Weather Server**: A core MCP server (`src/weather-server.ts`) exposing a `get_weather` tool.
2.  **Stdio Transport**: A wrapper (`src/server-stdio.ts`) to run the server over standard input/output.
3.  **SSE Transport**: An Express server (`src/server-sse.ts`) handling SSE connections on `/sse` and messages on `/messages`.
4.  **Local Client**: An MCP client (`src/client-local.ts`) that spawns the Stdio server.
5.  **Remote Client**: An MCP client (`src/client-remote.ts`) that connects to the SSE server.

## Key Dependencies

- **`@modelcontextprotocol/sdk`**: The official TypeScript SDK. It provides:
    - `McpServer` and `McpClient` classes for the core logical layer.
    - Transport implementations like `StdioServerTransport` (for local pipe-based comms) and `SSEServerTransport`/`SSEClientTransport` (for HTTP-based comms).
    - Protocol message types and connection management.

- **`zod`**: A TypeScript schema validation library.
    - **Why?** MCP enforces strict typing for tool arguments (e.g., verifying `city` is a string). Zod is the standard way to define these schemas in the MCP SDK, ensuring runtime safety.

- **`express`**: A minimal web framework for Node.js.
    - **Why?** We need a real HTTP server to expose the Server-Sent Events (SSE) endpoint (`/sse`) and the message posting endpoint (`/messages`) to allow remote clients to connect.

## Prerequisites

- Node.js (v18+)
- Dependencies installed: `npm install`
- Compiled TypeScript: `npx tsc` (recommended for reliability, creates `./dist`)

## Running the Examples

### 1. Local Connection (Stdio)

Run the local client directly. It automatically spawns the server process.

```bash
node --loader ts-node/esm --no-warnings src/client-local.ts
```

**Expected Output:**
```
Connected to server!
Tool result: {
  content: [ { type: 'text', text: 'Weather in San Francisco: Sunny, 25°C' } ]
}
```

### 2. Remote Connection (SSE)

This requires two terminal windows.

**Terminal 1: Start the SSE Server**
```bash
node dist/server-sse.js
```
Output:
```
SSE Server running on http://localhost:3001/sse
```

**Terminal 2: Run the Remote Client**
```bash
node dist/client-remote.js
```

**Expected Output (Client):**
```
Connecting to server...
Connected to server!
Tool result: {
  content: [ { type: 'text', text: 'Weather in London: Sunny, 25°C' } ]
}
```

## Troubleshooting

- **Module Configuration**: Ensure `package.json` has `"type": "module"`.
- **Ports**: The SSE server runs on port 3001 by default.
- **Compilation**: If `ts-node` behaves unexpectedly, run `npx tsc` and use `node dist/...`.
