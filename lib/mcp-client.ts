import { experimental_createMCPClient as createMCPClient } from 'ai';

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface MCPServerConfig {
  url: string;
  type: 'sse' | 'stdio';
  command?: string;
  args?: string[];
  env?: KeyValuePair[];
  headers?: KeyValuePair[];
}

export interface MCPClientManager {
  tools: Record<string, any>;
  clients: any[];
  cleanup: () => Promise<void>;
}

/**
 * Initialize MCP clients for API calls
 * This uses the already running persistent HTTP or SSE servers
 */
export async function initializeMCPClients(
  mcpServers: MCPServerConfig[] = [],
  abortSignal?: AbortSignal
): Promise<MCPClientManager> {
  console.log(`[DEBUG] initializeMCPClients - Initializing ${mcpServers.length} MCP servers`);
  
  // Initialize tools
  let tools = {};
  const mcpClients: any[] = [];

  // Process each MCP server configuration
  for (const mcpServer of mcpServers) {
    try {
      console.log(`[DEBUG] Initializing server: ${mcpServer.url}`);
      
      const headers = mcpServer.headers?.reduce((acc, header) => {
        if (header.key) acc[header.key] = header.value || '';
        return acc;
      }, {} as Record<string, string>);
      
      console.log(`[DEBUG] Server headers:`, Object.keys(headers || {}));

      // All servers are handled as HTTP or SSE
      const transport = {
        type: 'sse' as const,
        url: mcpServer.url,
        headers,
      };

      console.log(`[DEBUG] Creating MCP client for ${mcpServer.url}...`);
      const mcpClient = await createMCPClient({ transport });
      console.log(`[DEBUG] MCP client created successfully for ${mcpServer.url}`);
      
      mcpClients.push(mcpClient);

      console.log(`[DEBUG] Fetching tools from ${mcpServer.url}...`);
      const mcptools = await mcpClient.tools();
      console.log(`[DEBUG] Tools from ${mcpServer.url}:`, Object.keys(mcptools));

      // Add MCP tools to tools object
      tools = { ...tools, ...mcptools };
    } catch (error) {
      console.error(`[DEBUG] Failed to initialize MCP client for ${mcpServer.url}:`, error);
      // Continue with other servers instead of failing the entire request
    }
  }

  console.log(`[DEBUG] All MCP clients initialized, total tools:`, Object.keys(tools).length);
  return {
    tools,
    clients: mcpClients,
    cleanup: async () => {
      console.log(`[DEBUG] Cleaning up MCP clients...`);
      await cleanupMCPClients(mcpClients);
      console.log(`[DEBUG] MCP clients cleanup complete`);
    }
  };
}

async function cleanupMCPClients(clients: any[]): Promise<void> {
  // Clean up the MCP clients
  for (const client of clients) {
    try {
      await client.close();
    } catch (error) {
      console.error("Error closing MCP client:", error);
    }
  }
}