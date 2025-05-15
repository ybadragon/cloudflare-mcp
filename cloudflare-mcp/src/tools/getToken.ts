import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export async function getToken(cloudflareClient: any) {
  try {
    // Get the API token from environment variables
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    
    if (!apiToken) {
      throw new McpError(
        ErrorCode.InternalError,
        'Cloudflare API token not found in environment variables'
      );
    }
    
    // Return the first and last 4 characters of the token for security
    const tokenLength = apiToken.length;
    const maskedToken = apiToken.substring(0, 4) + '...' + apiToken.substring(tokenLength - 4);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'API token retrieved successfully',
            token_length: tokenLength,
            masked_token: maskedToken
          }, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting API token:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to get API token: ${error.message}`
    );
  }
}
