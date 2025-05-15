import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export async function verifyToken(cloudflareClient: any) {
  try {
    console.error('Verifying API token...');
    
    // Check if the client is properly initialized
    if (!cloudflareClient || !cloudflareClient.user || !cloudflareClient.user.tokens) {
      console.error('Cloudflare client is not properly initialized:', cloudflareClient);
      throw new McpError(
        ErrorCode.InternalError,
        'Cloudflare client is not properly initialized'
      );
    }
    
    // Call the verify method
    console.error('Calling Cloudflare API to verify token...');
    const response = await cloudflareClient.user.tokens.verify();
    console.error('Raw response from Cloudflare API:', JSON.stringify(response, null, 2));
    
    // Check if the response is valid
    if (!response) {
      throw new McpError(
        ErrorCode.InternalError,
        'Empty response from Cloudflare API'
      );
    }
    
    // Check if the response indicates success
    if (!response.success) {
      throw new McpError(
        ErrorCode.InternalError,
        `API token verification failed: ${JSON.stringify(response.errors || 'Unknown error')}`
      );
    }
    
    // Check if the result is present
    if (!response.result) {
      throw new McpError(
        ErrorCode.InternalError,
        'Missing result in Cloudflare API response'
      );
    }
    
    // Format the response
    const result = {
      status: response.result.status || 'unknown',
      id: response.result.id || 'unknown',
      permissions: response.result.permissions || []
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error verifying API token:', error);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to verify API token: ${error.message}`
    );
  }
}
