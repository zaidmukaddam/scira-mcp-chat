import { NextRequest, NextResponse } from 'next/server';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let client: Client | undefined = undefined;
    const baseUrl = new URL(url);

    try {
      // First try Streamable HTTP transport
      client = new Client({
        name: 'streamable-http-client',
        version: '1.0.0'
      });

      const transport = new StreamableHTTPClientTransport(baseUrl);
      await client.connect(transport);
      console.log("Connected using Streamable HTTP transport");
    } catch (error) {
      // If that fails with a 4xx error, try the older SSE transport
      console.log("Streamable HTTP connection failed, falling back to SSE transport");
      client = new Client({
        name: 'sse-client',
        version: '1.0.0'
      });
      const sseTransport = new SSEClientTransport(baseUrl);
      await client.connect(sseTransport);
      console.log("Connected using SSE transport");
    }

    // Get tools from the connected client
    const tools = await client.listTools();
    console.log('Tools response:', tools);

    // Disconnect after getting tools
    await client.close();

    if (tools && tools.tools) {
      return NextResponse.json({
        ready: true,
        tools: tools.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      });
    } else {
      return NextResponse.json({ ready: false, error: 'No tools available' }, { status: 503 });
    }
  } catch (error) {
    console.error('MCP health check failed:', error);
    return NextResponse.json({
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
} 