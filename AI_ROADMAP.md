# AI Learning Roadmap

This document outlines the next steps in your journey from "Tool Builder" to "Advanced AI Engineer".

```mermaid
graph TD
    Current["Current Status: Multi-Agent System Complete"] --> Phase2
    
    subgraph Phase 1: Context & Memory (Complete)
        Phase1["Goal: The Personal Assistant"]
        Memory["Add Short-Term Memory"]
        RAG["Add Long-Term Knowledge (RAG)"]
        VectorDB["Integrate Vector DB"]
    end
    
    subgraph Phase 3: Orchestration (Complete)
        Phase3["Goal: Multi-Agent Teams"]
        Manager["Manager Agent"]
        Workers["Worker Agents"]
        Frameworks["LangGraph / CrewAI"]
    end
    
    subgraph Phase 2: Freedom & Privacy (Next/Deferred)
        Phase2["Goal: Runs 100% Local"]
        Ollama["Install Ollama"]
        LocalModel["Switch to Llama 3 / Mistral"]
        CostFree["No API Key Limits"]
    end

    Phase1 --> Phase3
    Phase3 --> Phase2
```

## Phase 1: Give Your Agent "Context" (Memory & RAG)
**Status: ✅ Complete**
*   **Implementation**: `src/conversational-agent.ts`
*   **Knowledge**: `src/document-server.ts` (Simple Search)
*   **Result**: Agent remembers turns and can search local text files.

## Phase 3: Multi-Agent Systems (Orchestration)
**Status: ✅ Complete (Architecture Verified)**
*   **Manager**: `src/manager-agent.ts` (Task Planning & Delegation)
*   **Workers**: `src/worker-agents.ts` (Researcher, WeatherExpert, Writer)
*   **Mechanism**: Manager breaks down a query like "Compare weather in Paris and Tokyo" and delegates to multiple workers.

## Phase 2: Give Your Agent "Freedom" (Local LLMs)
**Status: ⏳ Deferred**
*   **Next Step**: Install [Ollama](https://ollama.com/) and update `baseURL` to `http://localhost:11434/v1`.
*   **Benefit**: Private, free, and infinite execution.

## Recommended Next Project: The Personal Knowledge Assistant ("Second Brain")
**Goal**: An agent that acts as your second brain.
- **Detailed Roadmap**: [SECOND_BRAIN_ROADMAP.md](SECOND_BRAIN_ROADMAP.md)
- **Stack**: Local LLM (Phase 2) + RAG MCP Server (Phase 1) + Manager (Phase 3).
