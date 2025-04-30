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
- Multiple MCP transport types (SSE and stdio) for connecting to various tool providers.
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
   - **SSE (Server-Sent Events)**: For HTTP-based remote servers
   - **stdio (Standard I/O)**: For local servers running on the same machine

#### SSE Configuration

If you select SSE transport:
1. Enter the server URL (e.g., `https://mcp.example.com/token/sse`)
2. Click "Add Server"

#### stdio Configuration

If you select stdio transport:
1. Enter the command to execute (e.g., `npx`)
2. Enter the command arguments (e.g., `-y @modelcontextprotocol/server-google-maps`)
   - You can enter space-separated arguments or paste a JSON array
3. Click "Add Server"

4. Click "Use" to activate the server for the current chat session.

### Available MCP Servers

You can use any MCP-compatible server with this application. Here are some examples:

- [Composio](https://composio.dev/mcp) - Provides search, code interpreter, and other tools
- [Zapier MCP](https://zapier.com/mcp) - Provides access to Zapier tools
- Any MCP server using stdio transport with npx and python3

## MCP Server Auto-Inject Functionality

This project supports automatic injection of MCP (Model Context Protocol) servers at runtime using a root-level `mcp.json` file. This allows you to pre-configure which MCP servers are available and which should be enabled by default when the app starts.

### How It Works
- Place an `mcp.json` file in your project root.
- Define all desired MCP servers under the `mcpServers` object.
- Each server configuration can include:
  - `type`: The type of server (e.g., `stdio`, `sse`, `http`).
  - `command`: The command to launch the MCP server (e.g., `npx`, `python3`).
  - `args`: An array of arguments to pass to the command. For example, `['-y', '@modelcontextprotocol/server-github']` will run `npx -y @modelcontextprotocol/server-github`.
  - `env`: An object of environment variables to set when launching the server. For example, `{ "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN" }` will set the token in the server's environment.
  - `autoEnable`: If `true`, the server will be enabled automatically at app launch.

**Best Practices:**
- Use `args` to keep your command line flexible and easy to update without changing the command itself.
- Store sensitive information like API keys in `env` and reference environment variables as needed.
- You can add as many custom environment variables as your MCP server supports.

The app will read this file at startup and inject all listed servers into the UI. Servers with `autoEnable: true` will be selected for immediate use.

### Sample mcp.json
```json
{
  "mcpServers": {
    "github": {
      "type": "stdio", // type of server, e.g., sse or stdio
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"
      },
      "autoEnable": true // auto-enable at launch
    }
  }
}
```

- You may add multiple servers under `mcpServers`.
- All fields are customizable per server.

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.