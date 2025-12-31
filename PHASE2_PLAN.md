# Phase 2 Implementation Plan: Local LLMs with Ollama

## Goal
Replace OpenAI API dependency with a local LLM running via Ollama, achieving complete privacy and zero API costs.

## Step 1: Install Ollama

### Installation
```bash
# Download and install Ollama for Mac
# Visit: https://ollama.com/download
# Or use Homebrew:
brew install ollama
```

### Download a Model
```bash
# Pull Llama 3 (8B parameters, ~4.7GB)
ollama pull llama3

# Alternative: Mistral (7B parameters, ~4.1GB)
ollama pull mistral
```

### Verify Installation
```bash
# Start Ollama server (runs on http://localhost:11434)
ollama serve

# Test in another terminal
ollama run llama3
```

---

## Step 2: Create Local Agent

### [NEW] [src/local-agent.ts](file:///Users/hiteshahuja/.gemini/antigravity/scratch/mcp-learning/src/local-agent.ts)

**Key Changes from `conversational-agent.ts`:**
1. Replace OpenAI client with Ollama-compatible client
2. Point to `http://localhost:11434/v1` instead of OpenAI API
3. Use model name `llama3` or `mistral`
4. Remove API key requirement

**OpenAI SDK Compatibility:**
Ollama provides an OpenAI-compatible API, so we can use the same `openai` package:

```typescript
const openai = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama' // Required but not used
});

const response = await openai.chat.completions.create({
    model: 'llama3',
    messages: messages,
    tools: openaiTools
});
```

---

## Step 3: Verification

### Test Local Agent
```bash
# Terminal 1: Ensure Ollama is running
ollama serve

# Terminal 2: Run the local agent
node dist/local-agent.js
```

**Expected Behavior:**
- No API key required
- Responses generated locally
- Works offline
- No usage costs

---

## Comparison: OpenAI vs Ollama

| Feature | OpenAI (Phase 1) | Ollama (Phase 2) |
|---------|------------------|------------------|
| Cost | $0.01-0.03 per 1K tokens | Free |
| Privacy | Data sent to OpenAI | 100% local |
| Speed | Fast (cloud GPUs) | Depends on Mac specs |
| Offline | No | Yes |
| Model Quality | GPT-4o (best) | Llama3 (very good) |

---

## Status
**Deferred** - Implementation postponed to focus on Phase 3 first.
