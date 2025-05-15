import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Process load balancers to extract only the specified fields
 * @param loadBalancers Array of load balancers from Cloudflare API
 * @param fields Optional array of field names to include
 * @param limit Maximum number of load balancers to return
 * @param offset Number of load balancers to skip (for pagination)
 * @returns Filtered array of load balancers
 */
function processLoadBalancers(
  loadBalancers: any[],
  fields?: string[],
  limit?: number,
  offset?: number
): any[] {
  // Apply offset and limit if specified
  const offsetValue = offset && offset > 0 ? offset : 0;
  const limitedLoadBalancers = limit && limit > 0 
    ? loadBalancers.slice(offsetValue, offsetValue + limit) 
    : loadBalancers.slice(offsetValue);
  
  if (fields && fields.length > 0) {
    // Return only specified fields
    return limitedLoadBalancers.map(lb => {
      const result: Record<string, any> = {};
      fields.forEach(field => {
        if (lb[field] !== undefined) {
          result[field] = lb[field];
        }
      });
      return result;
    });
  }
  
  // Return all fields
  return limitedLoadBalancers;
}

export async function listLoadBalancers(cloudflareClient: any, args: any) {
  try {
    // Validate required parameters
    if (!args.zone_id) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameter: zone_id'
      );
    }

    // Require at least one additional parameter to prevent generating too large of a prompt
    if (!args.load_balancer_id && !args.load_balancer_name && (!args.limit || args.limit <= 0)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'At least one of the following parameters is required: load_balancer_id, load_balancer_name, or limit (with a value > 0)'
      );
    }

    console.error(`Listing load balancers for zone ID: ${args.zone_id}`);
    
    // Check if the cloudflareClient is properly initialized
    if (!cloudflareClient || !cloudflareClient.loadBalancers) {
      console.error('Cloudflare client is not properly initialized:', cloudflareClient);
      throw new McpError(
        ErrorCode.InternalError,
        'Cloudflare client is not properly initialized'
      );
    }

    // Call Cloudflare API to list load balancers
    console.error('Calling Cloudflare API to list load balancers...');
    const response = await cloudflareClient.loadBalancers.list({
      zone_id: args.zone_id
    });
    console.error('Cloudflare API response received:', response);

    // Check if a specific load balancer is requested by ID
    if (args.load_balancer_id) {
      const loadBalancer = response.result.find((lb: any) => lb.id === args.load_balancer_id);
      if (!loadBalancer) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Load balancer with ID ${args.load_balancer_id} not found`
        );
      }
      
      // Apply field filtering if specified
      let result = loadBalancer;
      if (args.fields && args.fields.length > 0) {
        result = {};
        args.fields.forEach((field: string) => {
          if (loadBalancer[field] !== undefined) {
            result[field] = loadBalancer[field];
          }
        });
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
    
    // Check if a specific load balancer is requested by name
    if (args.load_balancer_name) {
      const loadBalancer = response.result.find((lb: any) => lb.name === args.load_balancer_name);
      if (!loadBalancer) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Load balancer with name ${args.load_balancer_name} not found`
        );
      }
      
      // Apply field filtering if specified
      let result = loadBalancer;
      if (args.fields && args.fields.length > 0) {
        result = {};
        args.fields.forEach((field: string) => {
          if (loadBalancer[field] !== undefined) {
            result[field] = loadBalancer[field];
          }
        });
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Extract optional parameters
    const limit = args.limit;
    const offset = args.offset;
    const fields = args.fields;

    // Process the load balancers to filter fields and apply limits and offset
    const processedLoadBalancers = processLoadBalancers(
      response.result,
      fields,
      limit,
      offset
    );

    // Format the response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(processedLoadBalancers, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error listing load balancers:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to list load balancers: ${error.message}`
    );
  }
}
