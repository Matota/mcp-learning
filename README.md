# MCP Learning Project

This project demonstrates how to build a Model Context Protocol (MCP) Server and Client, and connect them using both Local (Stdio) and Remote (SSE/HTTP) transports. It also shows how to build AI Agents with memory and knowledge retrieval capabilities.

Implementations are provided in both **TypeScript** (Node.js) and **Go**.

## Components

See [ARCHITECTURE.md](ARCHITECTURE.md) for visual diagrams of the system.

### Node.js (TypeScript)
1.  **Weather Server**: A core MCP server (`src/weather-server.ts`) exposing a `get_weather` tool.
2.  **Document Server**: An MCP server (`src/document-server.ts`) with semantic search using ChromaDB.
3.  **Stdio Transport**: A wrapper (`src/server-stdio.ts`) to run servers over standard input/output.
4.  **SSE Transport**: An Express server (`src/server-sse.ts`) handling SSE connections.
5.  **Local Client**: An MCP client (`src/client-local.ts`) that spawns the Stdio server.
6.  **Remote Client**: An MCP client (`src/client-remote.ts`) that connects to the SSE server.
7.  **Reflex Agent**: A rule-based agent (`src/reflex-agent.ts`) using regex pattern matching.
8.  **LLM Agent**: A single-shot agent (`src/llm-agent.ts`) powered by OpenAI GPT-4o.
9.  **Conversational Agent**: An interactive agent (`src/conversational-agent.ts`) with memory and RAG capabilities.

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
- **`openai`** (Node.js): For LLM integration.
- **`chromadb`** (Node.js): For vector database and semantic search.

## Prerequisites

- Node.js (v18+)
- Go (v1.20+)
- Dependencies installed: `npm install` and `go mod tidy` (in `mcp-go`).
- **OpenAI API Key**: Set `OPENAI_API_KEY` in `.env` for LLM agents.

## Running the Examples (Node.js)

### 1. Basic MCP - Local Connection (Stdio)
```bash
node --loader ts-node/esm --no-warnings src/client-local.ts
```

### 2. Basic MCP - Remote Connection (SSE)
Terminal 1:
```bash
node dist/server-sse.js
```
Terminal 2:
```bash
node dist/client-remote.js
```

### 3. AI Agents

#### Reflex Agent (No API Key Required)
```bash
node --loader ts-node/esm --no-warnings src/reflex-agent.ts "What is the weather in Paris?"
```

#### LLM Agent (Requires API Key)
```bash
node dist/llm-agent.js "What is the weather in New York?"
```

#### Conversational Agent with Memory & RAG (Requires API Key)
```bash
node dist/conversational-agent.js
```

**Example conversation:**
```
You: What is the capital of France?
Agent: [Uses search_documents] The capital of France is Paris...
You: And what about the weather there?
Agent: [Uses get_weather] The weather in Paris is Sunny, 25°C.
You: /quit
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

## Learning Path

See [AI_ROADMAP.md](AI_ROADMAP.md) for the complete learning roadmap including:
- Phase 1: Context & Memory (✅ Complete)
- Phase 2: Local LLMs with Ollama (Deferred - Documented)
- Phase 3: Multi-Agent Orchestration (✅ Complete with LangGraph)
