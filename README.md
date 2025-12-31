# MCP Learning Project

This project demonstrates how to build a Model Context Protocol (MCP) Server and Client, and connect them using both Local (Stdio) and Remote (SSE/HTTP) transports.
Implementations are provided in both **TypeScript** (Node.js) and **Go**.

## Components

See [ARCHITECTURE.md](ARCHITECTURE.md) for a visual diagram of the system.

### Node.js (TypeScript)
1.  **Weather Server**: A core MCP server (`src/weather-server.ts`) exposing a `get_weather` tool.
2.  **Stdio Transport**: A wrapper (`src/server-stdio.ts`) to run the server over standard input/output.
3.  **SSE Transport**: An Express server (`src/server-sse.ts`) handling SSE connections on `/sse` and messages on `/messages`.
4.  **Local Client**: An MCP client (`src/client-local.ts`) that spawns the Stdio server.
5.  **Remote Client**: An MCP client (`src/client-remote.ts`) that connects to the SSE server.

### Go
1.  **Command Line Tool**: A single entry point (`mcp-go/main.go`) handling all modes:
    *   `server-stdio`: Runs the server on Stdout/Stdin.
    *   `server-sse`: Runs an HTTP server with SSE support.
    *   `client-local`: Spawns the local server subprocess.
    *   `client-remote`: Connects to the HTTP server via SSE.

## Key Dependencies

- **`@modelcontextprotocol/sdk`**: The official TypeScript SDK.
- **`github.com/modelcontextprotocol/go-sdk`**: The official Go SDK.
- **`zod`** (Node.js): For schema validation.
- **`express`** (Node.js): For HTTP server.

## Prerequisites

- Node.js (v18+)
- Go (v1.20+)
- Dependencies installed: `npm install` and `go mod tidy` (in `mcp-go`).

## Running the Examples (Node.js)

### 1. Local Connection (Stdio)
```bash
node --loader ts-node/esm --no-warnings src/client-local.ts
```

### 2. Remote Connection (SSE)
Terminal 1:
```bash
node dist/server-sse.js
```
Terminal 2:
```bash
node dist/client-remote.js
```

## Running the Examples (Go)

Navigate to `mcp-go`:
```bash
cd mcp-go
```

### 1. Local Connection (Stdio)
```bash
go run main.go client-local
```

### 2. Remote Connection (SSE)

Terminal 1:
```bash
go run main.go server-sse
```

Terminal 2:
```bash
go run main.go client-remote
```
