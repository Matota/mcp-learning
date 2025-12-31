
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

const DOCUMENTS_DIR = "./documents";

// Schema for search arguments
const SearchArgsSchema = z.object({
    query: z.string().describe("The search query to find relevant documents")
});

/**
 * Simple Keyword Search Engine
 * This replaces ChromaDB for a more reliable, zero-dependency demo.
 */
class SimpleSearchEngine {
    private indexedDocs: { content: string; source: string }[] = [];

    async initialize() {
        if (!fs.existsSync(DOCUMENTS_DIR)) {
            console.error(`[Document Server] Warning: ${DOCUMENTS_DIR} directory not found.`);
            return;
        }

        const files = fs.readdirSync(DOCUMENTS_DIR).filter(f => f.endsWith('.txt') || f.endsWith('.md'));

        for (const file of files) {
            const filePath = path.join(DOCUMENTS_DIR, file);
            const content = fs.readFileSync(filePath, 'utf-8');

            // Split into paragraphs for better granularity
            const sections = content.split('\n\n').filter(s => s.trim());

            sections.forEach(section => {
                this.indexedDocs.push({
                    content: section.trim(),
                    source: file
                });
            });
        }
        console.error(`[Document Server] Indexed ${this.indexedDocs.length} sections from ${files.length} files`);
    }

    search(query: string, nResults: number = 3) {
        const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

        const scoredDocs = this.indexedDocs.map(doc => {
            const contentLower = doc.content.toLowerCase();
            let score = 0;

            queryTerms.forEach(term => {
                if (contentLower.includes(term)) {
                    score += 1;
                }
            });

            return { ...doc, score };
        });

        return scoredDocs
            .filter(doc => doc.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, nResults);
    }
}

// Create engine
const engine = new SimpleSearchEngine();

// Create MCP Server
const server = new Server(
    {
        name: "document-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_documents",
                description: "Search through local files using keyword matching. Returns relevant fragments.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The search query to find relevant documents"
                        }
                    },
                    required: ["query"]
                }
            }
        ]
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "search_documents") {
        const args = SearchArgsSchema.parse(request.params.arguments);

        try {
            const results = engine.search(args.query);

            let responseText = "";
            if (results.length === 0) {
                responseText = `No relevant documents found for "${args.query}".`;
            } else {
                responseText = "Found relevant information:\n\n";
                results.forEach((result, idx) => {
                    responseText += `[${result.source}] ${result.content}\n\n`;
                });
            }

            return {
                content: [
                    {
                        type: "text",
                        text: responseText
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error searching documents: ${error instanceof Error ? error.message : String(error)}`
                    }
                ],
                isError: true
            };
        }
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start server
async function main() {
    console.error("[Document Server] Initializing Local Search...");
    await engine.initialize();

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[Document Server] Running on Stdio (Keyword Search Mode)");
}

main().catch((error) => {
    console.error("[Document Server] Fatal error:", error);
    process.exit(1);
});
