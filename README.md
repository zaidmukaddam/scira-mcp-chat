<a href="https://mcp.scira.ai">
  <h1 align="center">Scira MCP Chat</h1>
</a>

<p align="center">
  An open-source AI chatbot app powered by Model Context Protocol (MCP), built with Next.js and the AI SDK by Vercel.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> •
  <a href="#development"><strong>Development</strong></a> •
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

## Development

### Prerequisites
- Node.js (version 18 or higher)
- pnpm

### Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/scira-mcp-chat-desktop.git
   cd scira-mcp-chat-desktop
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory with your AI provider API keys
   ```
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Anthropic
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # Google
   GOOGLE_API_KEY=your_google_api_key

   # Cohere
   COHERE_API_KEY=your_cohere_api_key

   # Groq
   GROQ_API_KEY=your_groq_api_key

   # XAI
   XAI_API_KEY=your_xai_api_key
   
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/mydatabase
   ```

### Database Setup

The application uses PostgreSQL with Drizzle ORM for data persistence. To set up the database:

1. Install PostgreSQL on your system or use a cloud service like [Neon](https://neon.tech)

2. Create a database and update your `.env` file with the database connection URL:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/mydatabase
   ```

3. Generate and push the database schema:
   ```bash
   # Generate migration files
   pnpm db:generate
   
   # Push schema to database
   pnpm db:push
   ```

4. You can explore your database using Drizzle Studio:
   ```bash
   pnpm db:studio
   ```

5. Start the development server
   ```bash
   pnpm dev
   ```

### Adding AI SDK Providers

This application uses the [AI SDK by Vercel](https://sdk.vercel.ai/docs) which supports multiple AI providers. You can configure additional providers by:

1. Adding the appropriate API key to your `.env` file
2. Configuring the provider in your code

The project already has the following AI SDK provider packages installed:
- `@ai-sdk/openai`
- `@ai-sdk/anthropic`
- `@ai-sdk/google`
- `@ai-sdk/cohere`
- `@ai-sdk/groq`
- `@ai-sdk/xai`

To obtain API keys:
- [OpenAI](https://platform.openai.com/api-keys)
- [Anthropic](https://console.anthropic.com/settings/keys)
- [Google AI](https://ai.google.dev/)
- [Cohere](https://dashboard.cohere.com/api-keys)
- [Groq](https://console.groq.com/keys)
- [XAI](https://console.x.ai/)

### Running and Building

#### Development
```bash
# Start the development server
pnpm dev
```

#### Distribution
```bash
# Build the application
pnpm build

# Create distributable (macOS)
pnpm dist
```

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