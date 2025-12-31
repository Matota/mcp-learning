
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ChromaClient } from "chromadb";
import * as fs from "fs";
import * as path from "path";

// Initialize ChromaDB client
const chromaClient = new ChromaClient();
const COLLECTION_NAME = "documents";
const DOCUMENTS_DIR = "./documents";

// Schema for search arguments
const SearchArgsSchema = z.object({
    query: z.string().describe("The search query to find relevant documents")
});

// Initialize and populate ChromaDB collection
async function initializeVectorDB() {
    try {
        // Try to get existing collection, or create new one
        let collection;
        try {
            collection = await chromaClient.getCollection({ name: COLLECTION_NAME });
            console.error("[Document Server] Using existing ChromaDB collection");
        } catch {
            collection = await chromaClient.createCollection({ name: COLLECTION_NAME });
            console.error("[Document Server] Created new ChromaDB collection");
        }

        // Index all text files in documents directory
        if (fs.existsSync(DOCUMENTS_DIR)) {
            const files = fs.readdirSync(DOCUMENTS_DIR).filter(f => f.endsWith('.txt'));

            if (files.length > 0) {
                const documents: string[] = [];
                const metadatas: any[] = [];
                const ids: string[] = [];

                for (const file of files) {
                    const filePath = path.join(DOCUMENTS_DIR, file);
                    const content = fs.readFileSync(filePath, 'utf-8');

                    // Split into chunks (simple line-based chunking)
                    const lines = content.split('\n').filter(line => line.trim());

                    lines.forEach((line, idx) => {
                        documents.push(line);
                        metadatas.push({ source: file, line: idx + 1 });
                        ids.push(`${file}_${idx}`);
                    });
                }

                // Add documents to collection
                await collection.add({
                    ids: ids,
                    documents: documents,
                    metadatas: metadatas
                });

                console.error(`[Document Server] Indexed ${documents.length} chunks from ${files.length} files`);
            }
        }

        return collection;
    } catch (error) {
        console.error("[Document Server] Error initializing vector DB:", error);
        throw error;
    }
}

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

// Store collection reference
let collection: any;

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_documents",
                description: "Search through indexed documents using semantic similarity. Returns relevant text chunks.",
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
            // Query ChromaDB
            const results = await collection.query({
                queryTexts: [args.query],
                nResults: 3
            });

            // Format results
            const documents = results.documents[0] || [];
            const metadatas = results.metadatas[0] || [];

            let responseText = "";
            if (documents.length === 0) {
                responseText = "No relevant documents found.";
            } else {
                responseText = "Found relevant information:\n\n";
                documents.forEach((doc: string, idx: number) => {
                    const meta = metadatas[idx] as any;
                    responseText += `[${meta.source}] ${doc}\n`;
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
    console.error("[Document Server] Initializing...");
    collection = await initializeVectorDB();

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[Document Server] Running on Stdio");
}

main().catch((error) => {
    console.error("[Document Server] Fatal error:", error);
    process.exit(1);
});
