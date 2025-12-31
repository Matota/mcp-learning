package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"

	"mcp-go/weather"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go [server-stdio|server-sse|client-local|client-remote]")
		os.Exit(1)
	}

	mode := os.Args[1]

	switch mode {
	case "server-stdio":
		s := weather.NewServer()
		// Server.Run takes context and transport
		if err := s.Run(context.Background(), &mcp.StdioTransport{}); err != nil {
			panic(err)
		}

	case "server-sse":
		// Serve on SSE
		http.Handle("/sse", mcp.NewSSEHandler(func(r *http.Request) *mcp.Server {
			return weather.NewServer()
		}, nil)) // nil options for now

		port := "3001"
		fmt.Printf("SSE Server running on http://localhost:%s/sse\n", port)
		if err := http.ListenAndServe(":"+port, nil); err != nil {
			panic(err)
		}

	case "client-local":
		// Connect to local stdio server
		cmd := exec.Command("go", "run", "main.go", "server-stdio")
		cmd.Stderr = os.Stderr // Pipe stderr to see server errors

		transport := &mcp.CommandTransport{
			Command: cmd,
		}

		ctx := context.Background()
		// NewClient takes (*Implementation, *ClientOptions)
		client := mcp.NewClient(&mcp.Implementation{
			Name:    "weather-client",
			Version: "1.0.0",
		}, &mcp.ClientOptions{})

		// Connect returns (*ClientSession, error). Connect handles initialization automatically?
		session, err := client.Connect(ctx, transport, &mcp.ClientSessionOptions{})
		if err != nil {
			panic(err)
		}
		defer session.Close()

		callResource(ctx, session, "San Francisco")

	case "client-remote":
		// Connect to remote SSE server
		transport := &mcp.SSEClientTransport{
			Endpoint: "http://localhost:3001/sse",
		}

		ctx := context.Background()
		client := mcp.NewClient(&mcp.Implementation{
			Name:    "weather-client-remote",
			Version: "1.0.0",
		}, &mcp.ClientOptions{})

		session, err := client.Connect(ctx, transport, &mcp.ClientSessionOptions{})
		if err != nil {
			panic(err)
		}
		defer session.Close()

		callResource(ctx, session, "London")

	default:
		fmt.Printf("Unknown mode: %s\n", mode)
		os.Exit(1)
	}
}

func callResource(ctx context.Context, session *mcp.ClientSession, city string) {
	fmt.Println("Connected to server!")
	result, err := session.CallTool(ctx, &mcp.CallToolParams{
		Name: "get_weather",
		Arguments: map[string]interface{}{
			"city": city,
		},
	})
	if err != nil {
		panic(err)
	}

	fmt.Printf("Tool result: %+v\n", result)
}
