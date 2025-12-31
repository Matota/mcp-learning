
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import dotenv from "dotenv";
import * as readline from "readline";
import { ResearcherAgent, WeatherAgent, WriterAgent } from "./worker-agents.js";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not set in environment variables.");
    process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface Task {
    type: "research" | "weather" | "write";
    description: string;
    input: string;
}

interface ExecutionPlan {
    tasks: Task[];
    finalSynthesis: string;
}

export class ManagerAgent {
    private researcher: ResearcherAgent;
    private weatherExpert: WeatherAgent;
    private writer: WriterAgent;

    constructor() {
        this.researcher = new ResearcherAgent();
        this.weatherExpert = new WeatherAgent();
        this.writer = new WriterAgent();
    }

    async initialize() {
        // Initialize workers with their respective MCP servers
        const documentTransport = new StdioClientTransport({
            command: "node",
            args: ["--loader", "ts-node/esm", "--no-warnings", "src/document-server.ts"]
        });

        const weatherTransport = new StdioClientTransport({
            command: "node",
            args: ["--loader", "ts-node/esm", "--no-warnings", "src/server-stdio.ts"]
        });

        await this.researcher.initialize(documentTransport);
        await this.weatherExpert.initialize(weatherTransport);

        console.log("[Manager] All workers initialized");
    }

    async createPlan(userRequest: string): Promise<ExecutionPlan> {
        const systemPrompt = `You are a task planning AI. Analyze user requests and create execution plans.

Available workers:
- Researcher: Searches documents and knowledge base
- WeatherExpert: Gets weather for cities
- Writer: Formats and summarizes content

Return a JSON plan with this structure:
{
  "tasks": [
    {"type": "research|weather|write", "description": "...", "input": "..."}
  ],
  "finalSynthesis": "How to combine results"
}

Examples:
User: "What's the weather in Paris?"
Plan: {"tasks": [{"type": "weather", "description": "Get Paris weather", "input": "Paris"}], "finalSynthesis": "Return weather data"}

User: "Write a blog about weather in London"
Plan: {"tasks": [{"type": "weather", "description": "Get London weather", "input": "London"}, {"type": "write", "description": "Create blog post", "input": "Write engaging blog post about: {weather_result}"}], "finalSynthesis": "Return blog post"}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userRequest }
            ],
            response_format: { type: "json_object" }
        });

        const planText = response.choices[0].message.content || "{}";
        return JSON.parse(planText) as ExecutionPlan;
    }

    async executeTask(task: Task, previousResults: Map<string, string>): Promise<string> {
        console.log(`[Manager] Delegating to ${task.type} worker: ${task.description}`);

        // Replace placeholders in input with previous results
        let input = task.input;
        for (const [key, value] of previousResults.entries()) {
            input = input.replace(`{${key}}`, value);
        }

        switch (task.type) {
            case "research":
                return await this.researcher.execute(input);
            case "weather":
                return await this.weatherExpert.execute(input);
            case "write":
                return await this.writer.execute("Write based on this information:", input);
            default:
                throw new Error(`Unknown task type: ${task.type}`);
        }
    }

    async processRequest(userRequest: string): Promise<string> {
        console.log(`\n[Manager] Analyzing request: "${userRequest}"`);

        // Create execution plan
        const plan = await this.createPlan(userRequest);
        console.log(`[Manager] Created plan with ${plan.tasks.length} task(s)`);

        // Execute tasks sequentially
        const results = new Map<string, string>();
        for (let i = 0; i < plan.tasks.length; i++) {
            const task = plan.tasks[i];
            const result = await this.executeTask(task, results);
            results.set(`task${i}_result`, result);
            results.set(`${task.type}_result`, result);
            console.log(`[Manager] Task ${i + 1} completed`);
        }

        // Synthesize final response
        if (plan.tasks.length === 1 && plan.tasks[0].type !== "write") {
            // Simple case: return the single result
            return results.get("task0_result") || "No result";
        } else {
            // Complex case: use Writer to synthesize
            const allResults = Array.from(results.entries())
                .map(([key, value]) => `${key}: ${value}`)
                .join("\n\n");

            return await this.writer.execute(
                `Synthesize a final response for the user. ${plan.finalSynthesis}`,
                allResults
            );
        }
    }

    async close() {
        await this.researcher.close();
        await this.weatherExpert.close();
    }
}

async function main() {
    const manager = new ManagerAgent();

    try {
        await manager.initialize();

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\n[Manager Agent] Ready! Type your requests or '/quit' to exit.\n");

        const askQuestion = () => {
            rl.question("You: ", async (userInput) => {
                if (!userInput.trim()) {
                    askQuestion();
                    return;
                }

                if (userInput.trim().toLowerCase() === "/quit") {
                    console.log("[Manager] Shutting down...");
                    rl.close();
                    await manager.close();
                    process.exit(0);
                }

                try {
                    const response = await manager.processRequest(userInput);
                    console.log(`\nAgent: ${response}\n`);
                } catch (error) {
                    console.error("[Manager] Error:", error instanceof Error ? error.message : error);
                }

                askQuestion();
            });
        };

        askQuestion();

    } catch (error) {
        console.error("[Manager] Critical Error:", error);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("Critical Error:", err);
    process.exit(1);
});
