import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
// Use the built-in fetch API instead of node-fetch

// Base URL for Cloudflare API
const CLOUDFLARE_API_BASE_URL = 'https://api.cloudflare.com/client/v4';

/**
 * Make a direct REST request to the Cloudflare API
 * @param endpoint The API endpoint to call (without the base URL)
 * @param method The HTTP method to use
 * @param apiToken The Cloudflare API token
 * @param body Optional request body for POST/PUT/PATCH requests
 * @returns The API response
 */
async function makeCloudflareRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  apiToken: string,
  body?: any
) {
  try {
    const url = `${CLOUDFLARE_API_BASE_URL}${endpoint}`;
    console.error(`Making ${method} request to ${url}`);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    };

    const options: any = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.error('Request options:', JSON.stringify(options, null, 2));
    const response = await fetch(url, options);
    const data = await response.json();
    console.error('Response status:', response.status);
    console.error('Response data:', JSON.stringify(data, null, 2));

    return { status: response.status, data };
  } catch (error: any) {
    console.error('Error making Cloudflare API request:', error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to make Cloudflare API request: ${error.message}`
    );
  }
}

/**
 * Verify a Cloudflare API token using direct REST request
 * @param args Empty object (no arguments needed)
 * @returns The verification result
 */
export async function verifyTokenDirect(args: any) {
  try {
    // Get the API token from environment variables
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    
    if (!apiToken) {
      throw new McpError(
        ErrorCode.InternalError,
        'Cloudflare API token not found in environment variables'
      );
    }

    console.error('Verifying API token via direct REST request...');
    const { status, data } = await makeCloudflareRequest(
      '/user/tokens/verify',
      'GET',
      apiToken
    );

    if (status !== 200 || !data.success) {
      const errorMessage = data.errors && data.errors.length > 0
        ? data.errors.map((e: any) => `${e.code}: ${e.message}`).join(', ')
        : 'Unknown error';
      
      throw new McpError(
        ErrorCode.InternalError,
        `API token verification failed: ${errorMessage}`
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data.result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error verifying API token via direct REST request:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to verify API token: ${error.message}`
    );
  }
}

/**
 * List Cloudflare load balancers for a specific zone using direct REST request
 * @param args Object containing zone_id
 * @returns The list of load balancers
 */
export async function listLoadBalancersDirect(args: any) {
  try {
    // Validate required parameters
    if (!args.zone_id) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameter: zone_id'
      );
    }

    // Get the API token from environment variables
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    
    if (!apiToken) {
      throw new McpError(
        ErrorCode.InternalError,
        'Cloudflare API token not found in environment variables'
      );
    }

    console.error(`Listing load balancers for zone ID: ${args.zone_id} via direct REST request...`);
    const { status, data } = await makeCloudflareRequest(
      `/zones/${args.zone_id}/load_balancers`,
      'GET',
      apiToken
    );

    if (status !== 200 || !data.success) {
      const errorMessage = data.errors && data.errors.length > 0
        ? data.errors.map((e: any) => `${e.code}: ${e.message}`).join(', ')
        : 'Unknown error';
      
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list load balancers: ${errorMessage}`
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data.result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error listing load balancers via direct REST request:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to list load balancers: ${error.message}`
    );
  }
}
