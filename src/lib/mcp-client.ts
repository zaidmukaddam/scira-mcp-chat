import { MCPTransport, experimental_createMCPClient as createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import { spawn } from 'child_process';

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

export async function initializeMCPClients(
  mcpServers: MCPServerConfig[] = [],
  abortSignal?: AbortSignal
): Promise<MCPClientManager> {
  // Initialize tools
  let tools = {};
  const mcpClients: any[] = [];

  // Process each MCP server configuration
  for (const mcpServer of mcpServers) {
    try {
      // Create appropriate transport based on type
      let transport: MCPTransport | { type: 'sse', url: string, headers?: Record<string, string> };

      if (mcpServer.type === 'sse') {
        transport = await createSSETransport(mcpServer);
      } else if (mcpServer.type === 'stdio') {
        transport = await createStdioTransport(mcpServer);
      } else {
        console.warn(`Skipping MCP server with unsupported transport type: ${mcpServer.type}`);
        continue;
      }

      const mcpClient = await createMCPClient({ transport });
      mcpClients.push(mcpClient);

      const mcptools = await mcpClient.tools();

      console.log(`MCP tools from ${mcpServer.type} transport:`, Object.keys(mcptools));

      // Add MCP tools to tools object
      tools = { ...tools, ...mcptools };
    } catch (error) {
      console.error("Failed to initialize MCP client:", error);
      // Continue with other servers instead of failing the entire request
    }
  }

  // Register cleanup for all clients if an abort signal is provided
  if (abortSignal && mcpClients.length > 0) {
    abortSignal.addEventListener('abort', async () => {
      await cleanupMCPClients(mcpClients);
    });
  }

  return {
    tools,
    clients: mcpClients,
    cleanup: async () => await cleanupMCPClients(mcpClients)
  };
}

async function createSSETransport(mcpServer: MCPServerConfig) {
  // Convert headers array to object for SSE transport
  const headers: Record<string, string> = {};
  if (mcpServer.headers && mcpServer.headers.length > 0) {
    mcpServer.headers.forEach(header => {
      if (header.key) headers[header.key] = header.value || '';
    });
  }

  return {
    type: 'sse' as const,
    url: mcpServer.url,
    headers: Object.keys(headers).length > 0 ? headers : undefined
  };
}

async function createStdioTransport(mcpServer: MCPServerConfig) {
  // For stdio transport, we need command and args
  if (!mcpServer.command || !mcpServer.args || mcpServer.args.length === 0) {
    throw new Error("Skipping stdio MCP server due to missing command or args");
  }

  // Convert env array to object for stdio transport
  const env: Record<string, string> = {};
  if (mcpServer.env && mcpServer.env.length > 0) {
    mcpServer.env.forEach(envVar => {
      if (envVar.key) env[envVar.key] = envVar.value || '';
    });
  }

  // Check for uvx pattern and transform to python3 -m uv run
  if (mcpServer.command === 'uvx') {
    await installUV();
    console.log("Detected uvx pattern, transforming to python3 -m uv run");
    mcpServer.command = 'python3';
    // Get the tool name (first argument)
    const toolName = mcpServer.args[0];
    // Replace args with the new pattern
    mcpServer.args = ['-m', 'uv', 'run', toolName, ...mcpServer.args.slice(1)];
  }
  // if python is passed in the command, install the python package mentioned in args after -m
  else if (mcpServer.command.includes('python3')) {
    const packageIndex = mcpServer.args.indexOf('-m') + 1;
    if (packageIndex > 0 && packageIndex < mcpServer.args.length) {
      const packageName = mcpServer.args[packageIndex];
      await installPythonPackage(packageName);
    }
  }

  return new StdioMCPTransport({
    command: mcpServer.command,
    args: mcpServer.args,
    env: Object.keys(env).length > 0 ? env : undefined
  });
}

async function installUV(): Promise<void> {
  const subprocess = spawn('pip3', ['install', 'uv']);
  
  return new Promise((resolve, reject) => {
    subprocess.on('close', (code: number) => {
      if (code !== 0) {
        console.error(`Failed to install uv: ${code}`);
        reject(new Error(`Failed to install uv: ${code}`));
      } else {
        console.log("installed uv");
        resolve();
      }
    });
  });
}

async function installPythonPackage(packageName: string): Promise<void> {
  console.log("installing python package", packageName);
  const subprocess = spawn('pip3', ['install', packageName]);
  
  return new Promise((resolve, reject) => {
    subprocess.on('close', (code: number) => {
      if (code !== 0) {
        console.error(`Failed to install python package: ${code}`);
        reject(new Error(`Failed to install python package: ${code}`));
      } else {
        console.log("installed python package", packageName);
        resolve();
      }
    });
  });
}

async function cleanupMCPClients(clients: any[]): Promise<void> {
  for (const client of clients) {
    try {
      await client.close();
    } catch (error) {
      console.error("Error closing MCP client:", error);
    }
  }
} 