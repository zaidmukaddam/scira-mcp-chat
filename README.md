<a href="https://ai-sdk-starter-xai.vercel.app">
  <h1 align="center">Vercel x xAI Chatbot</h1>
</a>

<p align="center">
  An open-source AI chatbot app template built with Next.js, the AI SDK by Vercel, and xAI.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running Locally</strong></a> ·
  <a href="#mcp-server-configuration"><strong>MCP Configuration</strong></a> ·
  <a href="#authors"><strong>Authors</strong></a>
</p>
<br/>

## Features

- Streaming text responses powered by the [AI SDK by Vercel](https://sdk.vercel.ai/docs), allowing multiple AI providers to be used interchangeably with just a few lines of code.
- Built-in tool integration for extending AI capabilities (demonstrated with a weather tool example).
- Support for [Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers to expand available tools.
- Multiple MCP transport types (SSE and stdio) for connecting to various tool providers.
- Reasoning model support.
- [shadcn/ui](https://ui.shadcn.com/) components for a modern, responsive UI powered by [Tailwind CSS](https://tailwindcss.com).
- Built with the latest [Next.js](https://nextjs.org) App Router.

## Deploy Your Own

You can deploy your own version to Vercel by clicking the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?project-name=Vercel+x+xAI+Chatbot&repository-name=ai-sdk-starter-xai&repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-sdk-starter-xai&demo-title=Vercel+x+xAI+Chatbot&demo-url=https%3A%2F%2Fai-sdk-starter-xai.labs.vercel.dev%2F&demo-description=A+simple+chatbot+application+built+with+Next.js+that+uses+xAI+via+the+AI+SDK+and+the+Vercel+Marketplace&products=[{%22type%22:%22integration%22,%22protocol%22:%22ai%22,%22productSlug%22:%22grok%22,%22integrationSlug%22:%22xai%22}])

## Running Locally

1. Clone the repository and install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. Install the [Vercel CLI](https://vercel.com/docs/cli):

   ```bash
   npm i -g vercel
   # or
   yarn global add vercel
   # or
   pnpm install -g vercel
   ```

   Once installed, link your local project to your Vercel project:

   ```bash
   vercel link
   ```

   After linking, pull your environment variables:

   ```bash
   vercel env pull
   ```

   This will create a `.env.local` file with all the necessary environment variables.

3. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view your new AI chatbot application.

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
1. Enter the command to execute (e.g., `node`)
2. Enter the command arguments (e.g., `src/mcp-server.js --port 3001`)
   - You can enter space-separated arguments or paste a JSON array
3. Click "Add Server"

4. Click "Use" to activate the server for the current chat session.

### Available MCP Servers

You can use any MCP-compatible server with this application. Here are some examples:

- [Composio](https://composio.dev) - Provides search, code interpreter, and other tools
- Any local MCP server using stdio transport
- [Any other third-party MCP server]

### Installing Required Dependencies

If you're running the project locally and encounter issues with MCP integration, make sure to install the required dependencies:

```bash
npm run install-mcp
# or
yarn install-mcp
# or
pnpm run install-mcp
```

### Creating Your Own MCP Server

For information on creating your own MCP server, refer to the [Model Context Protocol documentation](https://modelcontextprotocol.io).

## Authors

This repository is maintained by the [Vercel](https://vercel.com) team and community contributors.

Contributions are welcome! Feel free to open issues or submit pull requests to enhance functionality or fix bugs.
