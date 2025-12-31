
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not set in environment variables.");
    process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Base Worker Agent class
 */
abstract class WorkerAgent {
    protected mcpClient?: Client;

    abstract getName(): string;
    abstract getCapabilities(): string;
    abstract execute(task: string): Promise<string>;

    async initialize(transport: StdioClientTransport) {
        this.mcpClient = new Client(
            { name: `${this.getName()}-worker`, version: "1.0.0" },
            { capabilities: {} }
        );
        await this.mcpClient.connect(transport);
    }

    async close() {
        if (this.mcpClient) {
            await this.mcpClient.close();
        }
    }
}

/**
 * Researcher Agent - Uses document search
 */
export class ResearcherAgent extends WorkerAgent {
    getName(): string {
        return "Researcher";
    }

    getCapabilities(): string {
        return "Searches through documents and knowledge base to find relevant information";
    }

    async execute(query: string): Promise<string> {
        if (!this.mcpClient) {
            throw new Error("Researcher not initialized");
        }

        try {
            const result = await this.mcpClient.callTool({
                name: "search_documents",
                arguments: { query }
            });

            // @ts-ignore
            return result.content.map(c => c.text).join("\n");
        } catch (error) {
            return `Research failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}

/**
 * Weather Expert Agent - Uses weather API
 */
export class WeatherAgent extends WorkerAgent {
    getName(): string {
        return "WeatherExpert";
    }

    getCapabilities(): string {
        return "Retrieves current weather information for any city";
    }

    async execute(city: string): Promise<string> {
        if (!this.mcpClient) {
            throw new Error("Weather Expert not initialized");
        }

        try {
            const result = await this.mcpClient.callTool({
                name: "get_weather",
                arguments: { city }
            });

            // @ts-ignore
            return result.content.map(c => c.text).join("\n");
        } catch (error) {
            return `Weather lookup failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}

/**
 * Writer Agent - Uses LLM to format and summarize
 */
export class WriterAgent {
    getName(): string {
        return "Writer";
    }

    getCapabilities(): string {
        return "Formats, summarizes, and writes content based on provided information";
    }

    async execute(instruction: string, content: string): Promise<string> {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are a professional writer. Format and present information clearly and engagingly." },
                    { role: "user", content: `${instruction}\n\nContent:\n${content}` }
                ]
            });

            return response.choices[0].message.content || "No response generated";
        } catch (error) {
            return `Writing failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}
