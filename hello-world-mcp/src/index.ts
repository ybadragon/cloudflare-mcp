#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

class HelloWorldServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'hello-world-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'hello_world',
          description: 'Returns a greeting message',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name to greet',
              },
            },
            required: ['name'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'hello_world') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const args = request.params.arguments;
      if (typeof args !== 'object' || args === null || typeof args.name !== 'string') {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid arguments: expected { name: string }'
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `Hello, ${args.name}! Welcome to the MCP world.`,
          },
        ],
      };
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Hello World MCP server running on stdio');
  }
}

const server = new HelloWorldServer();
server.run().catch(console.error);
