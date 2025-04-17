import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { IntercomClient } from "./api/client.js";
import {
  SearchConversationsSchema,
  listConversationsFromLastWeek,
} from "./tools/conversations.js";
import { searchArticles, SearchArticlesSchema } from "./tools/articles.js";
import { z } from "zod";
const server = new Server(
  {
    name: "intercom",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {
        "search-conversations": {
          description:
            "Search Intercom conversations with filters for created_at, updated_at, source type, state, open, and read status",
          inputSchema: SearchConversationsSchema,
          outputSchema: z.any(),
        },
        "list-conversations-from-last-week": {
          description:
            "Fetch all conversations from the last week (last 7 days)",
          inputSchema: z.object({}),
          outputSchema: z.any(),
        },
        "search-articles": {
          description:
            "Search the default help center for articles that match the provided phrase",
          inputSchema: SearchArticlesSchema,
          outputSchema: z.any(),
        },
      },
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search-conversations",
        description:
          "Search Intercom conversations with filters for created_at, updated_at, source type, state, open, and read status",
        inputSchema: {
          type: "object",
          properties: {
            createdAt: {
              type: "object",
              properties: {
                operator: {
                  type: "string",
                  description: 'Operator for created_at (e.g., ">", "<", "=")',
                },
                value: {
                  type: "integer",
                  description: "Timestamp value for created_at filter",
                },
              },
            },
            updatedAt: {
              type: "object",
              properties: {
                operator: {
                  type: "string",
                  description: 'Operator for updated_at (e.g., ">", "<", "=")',
                },
                value: {
                  type: "integer",
                  description: "Timestamp value for updated_at filter",
                },
              },
            },
            sourceType: {
              type: "string",
              description:
                'Source type of the conversation (e.g., "email", "chat")',
            },
            state: {
              type: "string",
              description:
                'Conversation state to filter by (e.g., "open", "closed")',
            },
            open: {
              type: "boolean",
              description: "Filter by open status",
            },
            read: {
              type: "boolean",
              description: "Filter by read status",
            },
          },
        },
      },
      {
        name: "list-conversations-from-last-week",
        description: "Fetch all conversations from the last week (last 7 days)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "search-articles",
        description:
          "Search the default help center for articles that match the provided phrase",
        inputSchema: {
          type: "object",
          properties: {
            phrase: {
              type: "string",
              description: "Phrase to search for in articles",
            },
          },
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search-conversations") {
    try {
      const validatedArgs = SearchConversationsSchema.parse(args);
      const intercomClient = new IntercomClient();
      const conversations = await intercomClient.searchConversations(
        validatedArgs
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(conversations, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
      throw error;
    }
  }

  if (name === "list-conversations-from-last-week") {
    try {
      const conversations = await listConversationsFromLastWeek();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(conversations, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
      throw error;
    }
  }

  if (name === "search-articles") {
    try {
      const validatedArgs = SearchArticlesSchema.parse(args);
      const intercomClient = new IntercomClient();
      const { articles } = await searchArticles(validatedArgs, server);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ articles }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
      throw error;
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Intercom MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
