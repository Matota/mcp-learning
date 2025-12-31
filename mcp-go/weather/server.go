package weather

import (
	"context"
	"fmt"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func NewServer() *mcp.Server {
	// Pass Implementation as first arg, ServerOptions as second
	server := mcp.NewServer(&mcp.Implementation{
		Name:    "weather-server",
		Version: "1.0.0",
	}, &mcp.ServerOptions{
		// Options
	})

	type WeatherArgs struct {
		City string `json:"city"`
	}

	mcp.AddTool(server, &mcp.Tool{
		Name:        "get_weather",
		Description: "Get weather for a city",
	}, func(ctx context.Context, request *mcp.CallToolRequest, args WeatherArgs) (*mcp.CallToolResult, any, error) {
		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{
					Text: fmt.Sprintf("Weather in %s: Sunny, 25°C", args.City),
				},
			},
		}, nil, nil
	})

	return server
}
