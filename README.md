<a href="https://mcp.scira.ai">
  <h1 align="center">Scira MCP Chat</h1>
</a>

<p align="center">
  An open-source AI chatbot app powered by Model Context Protocol (MCP), built with Next.js and the AI SDK by Vercel.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> •
  <a href="#mcp-server-configuration"><strong>MCP Configuration</strong></a> •
  <a href="#license"><strong>License</strong></a>
</p>
<br/>

## Features

- Streaming text responses powered by the [AI SDK by Vercel](https://sdk.vercel.ai/docs), allowing multiple AI providers to be used interchangeably with just a few lines of code.
- Full integration with [Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers to expand available tools and capabilities.
- HTTP and SSE transport types for connecting to various MCP tool providers.
- Built-in tool integration for extending AI capabilities.
- Reasoning model support.
- [shadcn/ui](https://ui.shadcn.com/) components for a modern, responsive UI powered by [Tailwind CSS](https://tailwindcss.com).
- Built with the latest [Next.js](https://nextjs.org) App Router.

## MCP Server Configuration

This application supports connecting to Model Context Protocol (MCP) servers to access their tools. You can add and manage MCP servers through the settings icon in the chat interface.

### Adding an MCP Server

1. Click the settings icon (⚙️) next to the model selector in the chat interface.
2. Enter a name for your MCP server.
3. Select the transport type:
   - **HTTP**: For HTTP-based remote servers
   - **SSE (Server-Sent Events)**: For SSE-based remote servers

#### HTTP or SSE Configuration

1. Enter the server URL (e.g., `https://mcp.example.com/mcp` or `https://mcp.example.com/token/sse`)
2. Click "Add Server"
3. Click "Enable Server" to activate the server for the current chat session.

### Available MCP Servers

You can use any MCP-compatible server with this application. Here are some examples:

- [Composio](https://composio.dev/mcp) - Provides search, code interpreter, and other tools
- [Zapier MCP](https://zapier.com/mcp) - Provides access to Zapier tools
- [Hugging Face MCP](https://huggingface.co/mcp) - Provides tool access to Hugging Face Hub
- Any MCP server compatible with HTTP or SSE transport

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.