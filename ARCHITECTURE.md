# System Architecture

This document visualizes how the MCP Client and Server communicate in both **Local** and **Remote** modes.

## 1. Local Connection (Stdio Transport)
In this mode, the Client spawns the Server as a subprocess. They communicate directly via Standard Input (Stdin) and Standard Output (Stdout). This is ideal for local, secure tools.

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant S as "MCP Server (Subprocess)"

    C->>S: Spawn Process (node/go run)
    C->>S: JSON-RPC Request (via Stdin)
    Note over S: Executes "get_weather"
    S->>C: JSON-RPC Response (via Stdout)
```

## 2. Remote Connection (SSE Transport)
In this mode, the Server runs as an HTTP Service (using Express or net/http). The Client connects via HTTP.
*   **SSE (`/sse`)**: Used for server-to-client events (like notifications).
*   **POST (`/messages`)**: Used for client-to-server requests.

```mermaid
sequenceDiagram
    participant C as MCP Client
    participant H as HTTP Server
    participant S as MCP Logic

    C->>H: GET /sse (Connect)
    H-->>C: Connection Established (Session ID)
    
    C->>H: POST /messages (JSON-RPC Request)
    H->>S: Route to MCP Logic
    Note over S: Executes "get_weather"
    S->>H: Result
    H-->>C: JSON-RPC Response (via SSE or HTTP Response)
```

## High Level Overview

```mermaid
graph TD
    subgraph Local Mode
        LocalClient["Local Client"] <==>|Stdio Pipe| StdioServer["Stdio Server"]
    end

    subgraph Remote Mode
        RemoteClient["Remote Client"]
        HTTPServer["HTTP Server (SSE)"]
        
        RemoteClient -- GET /sse --> HTTPServer
        RemoteClient -- POST /messages --> HTTPServer
        HTTPServer -- Internal Call --> MCPServer["MCP Server Logic"]
    end
    
    StdioServer --> WeatherTool["Weather Tool"]
    MCPServer --> WeatherTool
```
