import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * List zones in a Cloudflare account
 * @param cloudflareClient The Cloudflare client
 * @param args Optional arguments for filtering zones
 * @returns The list of zones
 */
export async function listZones(cloudflareClient: any, args: any) {
  try {
    console.error('Listing zones...');
    
    // Check if the cloudflareClient is properly initialized
    if (!cloudflareClient || !cloudflareClient.zones) {
      console.error('Cloudflare client is not properly initialized:', cloudflareClient);
      throw new McpError(
        ErrorCode.InternalError,
        'Cloudflare client is not properly initialized'
      );
    }

    // Prepare parameters for the API call
    const params: any = {};
    
    // Add optional filters if provided
    if (args.name) {
      params.name = args.name;
    }
    
    if (args.status) {
      params.status = args.status;
    }
    
    if (args.page) {
      params.page = args.page;
    }
    
    if (args.per_page) {
      params.per_page = args.per_page;
    }
    
    if (args.order) {
      params.order = args.order;
    }
    
    if (args.direction) {
      params.direction = args.direction;
    }
    
    if (args.match) {
      params.match = args.match;
    }

    // Call Cloudflare API to list zones
    console.error('Calling Cloudflare API to list zones with params:', params);
    const response = await cloudflareClient.zones.list(params);
    console.error('Cloudflare API response received:', response);

    // Format the response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error listing zones:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to list zones: ${error.message}`
    );
  }
}
