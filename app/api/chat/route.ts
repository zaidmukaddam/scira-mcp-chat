import { model, type modelID } from "@/ai/providers";
import { streamText, type UIMessage } from "ai";
import { appendResponseMessages } from 'ai';
import { saveChat, saveMessages, convertToDBMessages } from '@/lib/chat-store';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

import { experimental_createMCPClient as createMCPClient, MCPTransport } from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import { spawn } from "child_process";

// Allow streaming responses up to 30 seconds
export const maxDuration = 120;

interface KeyValuePair {
  key: string;
  value: string;
}

interface MCPServerConfig {
  url: string;
  type: 'sse' | 'stdio';
  command?: string;
  args?: string[];
  env?: KeyValuePair[];
  headers?: KeyValuePair[];
}

export async function POST(req: Request) {
  const {
    messages,
    chatId,
    selectedModel,
    userId,
    mcpServers = [],
  }: {
    messages: UIMessage[];
    chatId?: string;
    selectedModel: modelID;
    userId: string;
    mcpServers?: MCPServerConfig[];
  } = await req.json();

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "User ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const id = chatId || nanoid();

  // Check if chat already exists for the given ID
  // If not, we'll create it in onFinish
  let isNewChat = false;
  if (chatId) {
    try {
      const existingChat = await db.query.chats.findFirst({
        where: and(
          eq(chats.id, chatId),
          eq(chats.userId, userId)
        )
      });
      isNewChat = !existingChat;
    } catch (error) {
      console.error("Error checking for existing chat:", error);
      // Continue anyway, we'll create the chat in onFinish
      isNewChat = true;
    }
  } else {
    // No ID provided, definitely new
    isNewChat = true;
  }

  // Initialize tools
  let tools = {};
  const mcpClients: any[] = [];

  // Process each MCP server configuration
  for (const mcpServer of mcpServers) {
    try {
      // Create appropriate transport based on type
      let transport: MCPTransport | { type: 'sse', url: string, headers?: Record<string, string> };

      if (mcpServer.type === 'sse') {
        // Convert headers array to object for SSE transport
        const headers: Record<string, string> = {};
        if (mcpServer.headers && mcpServer.headers.length > 0) {
          mcpServer.headers.forEach(header => {
            if (header.key) headers[header.key] = header.value || '';
          });
        }

        transport = {
          type: 'sse' as const,
          url: mcpServer.url,
          headers: Object.keys(headers).length > 0 ? headers : undefined
        };
      } else if (mcpServer.type === 'stdio') {
        // For stdio transport, we need command and args
        if (!mcpServer.command || !mcpServer.args || mcpServer.args.length === 0) {
          console.warn("Skipping stdio MCP server due to missing command or args");
          continue;
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
          // install uv
          const subprocess = spawn('pip3', ['install', 'uv']);
          subprocess.on('close', (code: number) => {
            if (code !== 0) {
              console.error(`Failed to install uv: ${code}`);
            }
          });
          // wait for the subprocess to finish
          await new Promise((resolve) => {
            subprocess.on('close', resolve);
            console.log("installed uv");
          });
          console.log("Detected uvx pattern, transforming to python3 -m uv run");
          mcpServer.command = 'python3';
          // Get the tool name (first argument)
          const toolName = mcpServer.args[0];
          // Replace args with the new pattern
          mcpServer.args = ['-m', 'uv', 'run', toolName, ...mcpServer.args.slice(1)];
        }
        // if python is passed in the command, install the python package mentioned in args after -m with subprocess or use regex to find the package name
        else if (mcpServer.command.includes('python3')) {
          const packageName = mcpServer.args[mcpServer.args.indexOf('-m') + 1];
          console.log("installing python package", packageName);
          const subprocess = spawn('pip3', ['install', packageName]);
          subprocess.on('close', (code: number) => {
            if (code !== 0) {
              console.error(`Failed to install python package: ${code}`);
            }
          });
          // wait for the subprocess to finish
          await new Promise((resolve) => {
            subprocess.on('close', resolve);
            console.log("installed python package", packageName);
          });
        }

        transport = new StdioMCPTransport({
          command: mcpServer.command,
          args: mcpServer.args,
          env: Object.keys(env).length > 0 ? env : undefined
        });
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

  // Register cleanup for all clients
  if (mcpClients.length > 0) {
    req.signal.addEventListener('abort', async () => {
      for (const client of mcpClients) {
        try {
          await client.close();
        } catch (error) {
          console.error("Error closing MCP client:", error);
        }
      }
    });
  }

  console.log("messages", messages);
  console.log("parts", messages.map(m => m.parts.map(p => p)));

  // If there was an error setting up MCP clients but we at least have composio tools, continue
  const result = streamText({
    model: model.languageModel(selectedModel),
    system: `You are a helpful assistant with access to a variety of tools.

    Today's date is ${new Date().toISOString().split('T')[0]}.

    The tools are very powerful, and you can use them to answer the user's question.
    So choose the tool that is most relevant to the user's question.

    If tools are not available, say you don't know or if the user wants a tool they can add one from the server icon in bottom left corner in the sidebar.

    You can use multiple tools in a single response.
    Always respond after using the tools for better user experience.
    You can run multiple steps using all the tools!!!!
    Make sure to use the right tool to respond to the user's question.

    Multiple tools can be used in a single response and multiple steps can be used to answer the user's question.

    ## Response Format
    - Markdown is supported.
    - Respond according to tool's response.
    - Use the tools to answer the user's question.
    - If you don't know the answer, use the tools to find the answer or say you don't know.
    `,
    messages,
    tools,
    maxSteps: 20,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 2048,
        },
      },
      anthropic: {
        thinking: { 
          type: 'enabled', 
          budgetTokens: 12000 
        },
      } 
    },
    onError: (error) => {
      console.error(JSON.stringify(error, null, 2));
    },
    async onFinish({ response }) {
      const allMessages = appendResponseMessages({
        messages,
        responseMessages: response.messages,
      });

      await saveChat({
        id,
        userId,
        messages: allMessages,
      });

      const dbMessages = convertToDBMessages(allMessages, id);
      await saveMessages({ messages: dbMessages });
      // close all mcp clients
      // for (const client of mcpClients) {
      //   await client.close();
      // }
    }
  });

  result.consumeStream()
  return result.toDataStreamResponse({
    sendReasoning: true,
    getErrorMessage: (error) => {
      if (error instanceof Error) {
        if (error.message.includes("Rate limit")) {
          return "Rate limit exceeded. Please try again later.";
        }
      }
      console.error(error);
      return "An error occurred.";
    },
  });
}
