# AI Learning Roadmap

This document outlines the next steps in your journey from "Tool Builder" to "Advanced AI Engineer".

```mermaid
graph TD
    Current[Current Status: Basic Agent] --> Phase1
    
    subgraph Phase 1: Context & Memory
        Phase1[Goal: The Personal Assistant]
        Memory[Add Short-Term Memory]
        RAG[Add Long-Term Knowledge (RAG)]
        VectorDB[Integrate Vector DB]
    end
    
    subgraph Phase 2: Freedom & Privacy
        Phase2[Goal: Runs 100% Local]
        Ollama[Install Ollama]
        LocalModel[Switch to Llama 3 / Mistral]
        CostFree[No API Key Limits]
    end
    
    subgraph Phase 3: Orchestration
        Phase3[Goal: Multi-Agent Teams]
        Manager[Manager Agent]
        Workers[Worker Agents]
        Frameworks[LangGraph / CrewAI]
    end

    Phase1 --> Phase2
    Phase2 --> Phase3
```

## Phase 1: Give Your Agent "Context" (Memory & RAG)
**Problem**: Your current agent forgets everything after each run and knows nothing about your private files.
*   **Step 1: Short-Term Memory**
    *   *Action*: Update `llm-agent.ts` to run in a loop (`while(true)`).
    *   *Mechanism*: Pass the entire conversation history array to OpenAI on every turn, not just the latest message.
*   **Step 2: RAG (Retrieval-Augmented Generation)**
    *   *Action*: Build a new MCP Tool called `search_documents`.
    *   *Tech*: Use a Vector Database (like ChromaDB or Pinecone) to index your PDF/Text files.
    *   *Result*: Agent can answer "Summarize that PDF I downloaded yesterday."

## Phase 2: Give Your Agent "Freedom" (Local LLMs)
**Problem**: You are dependent on OpenAI's API availability and costs.
*   **Step 1: Install Ollama**
    *   *Action*: Download [Ollama](https://ollama.com/) for Mac.
    *   *Command*: `ollama run llama3`
*   **Step 2: Switch the Brain**
    *   *Action*: Modify `llm-agent.ts` to point to `http://localhost:11434/v1` instead of `api.openai.com`.
    *   *Result*: A completely private, free, and offline AI agent.

## Phase 3: Multi-Agent Systems (Orchestration)
**Problem**: One single LLM gets confused with too many complex tools or long tasks.
*   **Step 1: Manager-Worker Pattern**
    *   *Concept*: Create a "Manager" agent that breaks down a complex task (e.g., "Research and write a blog post").
    *   *Delegation*: The Manager uses `call_worker` tools to assign sub-tasks to specialized "Researcher" and "Writer" agents.
*   **Step 2: Frameworks**
    *   *Action*: Explore **LangGraph** or **CrewAI**.
    *   *Why?*: These provide built-in structures for handling state, loops, and agent collaboration.

## Recommended Next Project
**"The Personal Knowledge Assistant"**
*   **Goal**: An agent that acts as your second brain.
*   **Stack**: Local LLM (Phase 2) + RAG MCP Server (Phase 1).
