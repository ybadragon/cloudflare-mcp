#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import Cloudflare from 'cloudflare';
import { listLoadBalancers } from './tools/loadBalancers.js';
import { getToken } from './tools/getToken.js';
import { listZones } from './tools/listZones.js';

class CloudflareMcpServer {
  private server: Server;
  private cloudflareClient: any;

  constructor() {
    this.server = new Server(
      {
        name: 'cloudflare-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    // Initialize Cloudflare client
    this.initCloudflareClient();
    
    // Set up tool handlers
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private initCloudflareClient() {
    // Get Cloudflare API token from environment variables
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    
    if (!apiToken) {
      console.error('Cloudflare API token not found in environment variables');
      console.error('Please set CLOUDFLARE_API_TOKEN');
      process.exit(1);
    }
    
    console.error(`Initializing Cloudflare client with API token (length: ${apiToken.length} characters)`);
    
    try {
      // Initialize Cloudflare client with API token
      this.cloudflareClient = new Cloudflare({
        apiToken: apiToken
      });
      console.error('Cloudflare client initialized successfully');
    } catch (error) {
      console.error('Error initializing Cloudflare client:', error);
      process.exit(1);
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_load_balancers',
          description: 'List Cloudflare load balancers for a specific zone. REQUIRES at least one of: load_balancer_id, load_balancer_name, or limit (with a value > 0) to prevent generating too large of a response. Use offset with limit for pagination.',
          inputSchema: {
            type: 'object',
            properties: {
              zone_id: {
                type: 'string',
                description: 'The ID of the zone to list load balancers for',
              },
              load_balancer_id: {
                type: 'string',
                description: 'ID of a specific load balancer to retrieve',
              },
              load_balancer_name: {
                type: 'string',
                description: 'Name of a specific load balancer to retrieve',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of load balancers to return (REQUIRED if load_balancer_id or load_balancer_name not provided)',
              },
              offset: {
                type: 'number',
                description: 'Number of load balancers to skip (for pagination, works with limit)',
              },
              fields: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of field names to include in the response (default: all fields)',
              },
            },
            required: ['zone_id'],
          },
        },
        {
          name: 'get_token',
          description: 'Get information about the Cloudflare API token being used',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'list_zones',
          description: 'List Cloudflare zones in your account',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Filter by zone name',
              },
              status: {
                type: 'string',
                description: 'Filter by zone status',
              },
              page: {
                type: 'number',
                description: 'Page number of paginated results',
              },
              per_page: {
                type: 'number',
                description: 'Number of zones per page',
              },
              order: {
                type: 'string',
                description: 'Field to order zones by',
              },
              direction: {
                type: 'string',
                description: 'Direction to order zones',
              },
              match: {
                type: 'string',
                description: 'Whether to match all search requirements or at least one',
              }
            },
            required: [],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments;

      if (typeof args !== 'object' || args === null) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid arguments: expected an object'
        );
      }

      switch (toolName) {
        case 'list_load_balancers':
          return await listLoadBalancers(this.cloudflareClient, args);
        case 'get_token':
          return await getToken(this.cloudflareClient);
        case 'list_zones':
          return await listZones(this.cloudflareClient, args);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${toolName}`
          );
      }
    });
  }

  async run() {
    try {
      // Connect to the transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Cloudflare MCP server running on stdio');
    } catch (error) {
      console.error('Error running Cloudflare MCP server:', error);
      process.exit(1);
    }
  }
}

const server = new CloudflareMcpServer();
server.run().catch(console.error);
