// import Sandbox from "@e2b/code-interpreter";
import { Daytona, Sandbox } from "@daytonaio/sdk";

export const startMcpSandbox = async ({
  cmd,
  envs = {},
}: {
  cmd: string
  envs?: Record<string, string>
}) => {
  console.log("Creating sandbox...");

  try {
    const daytona = new Daytona();
    const sandbox = await daytona.create(
      {
      resources: {
        cpu: 2,
        memory: 4,
        disk: 5,
      },
      public: true,
      autoStopInterval: 0,
      envVars: {
        ...envs,
      },
    },
      {
        timeout: 0,
      }
    );

    const host = await sandbox.getPreviewLink(3000);
    const url = host.url;
    const token = host.token;
    console.log("url", url);
    console.log("token", token);

    const sessionId = Math.random().toString(36).substring(2, 30);
    await sandbox.process.createSession(sessionId);

    // Handle Python package installation if command is a Python command
    const isPythonCommand = cmd.startsWith('python') || cmd.startsWith('python3');
    let installResult = null;

    if (isPythonCommand) {
      const packageName = cmd.split("-m ")[1]?.split(" ")[0] || "";
      if (packageName) {
        console.log(`Installing Python package: ${packageName}`);
        installResult = await sandbox.process.executeSessionCommand(
          sessionId,
          {
            command: `pip install ${packageName}`,
            runAsync: true,
          },
          1000 * 300 // 5 minutes
        );

        console.log("install result", installResult.output);
        if (installResult.exitCode) {
          console.error(`Failed to install package ${packageName}. Exit code: ${installResult.exitCode}`);
        }
      }
    }

    console.log("Starting mcp server...");
    // Run the MCP server using supergateway
    const mcpServer = await sandbox.process.executeSessionCommand(
      sessionId,
      {
        command: `npx -y supergateway --base-url ${url} --header "x-daytona-preview-token: ${token}" --port 3000 --cors --stdio "${cmd}"`,
        runAsync: true,
      },
      0
    );

    console.log("mcp server result", mcpServer.output);

    if (mcpServer.exitCode) {
      console.error("Failed to start mcp server. Exit code:", mcpServer.exitCode);
      throw new Error(`MCP server failed to start with exit code ${mcpServer.exitCode}`);
    }

    console.log("MCP server started at:", url + "/sse");
    return new McpSandbox(sandbox, sessionId);
  } catch (error) {
    console.error("Error starting MCP sandbox:", error);
    throw error;
  }
}

class McpSandbox {
  public sandbox: Sandbox;
  private sessionId?: string;

  constructor(sandbox: Sandbox, sessionId?: string) {
    this.sandbox = sandbox;
    this.sessionId = sessionId;
  }

  async getUrl(): Promise<string> {
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized");
    }
    const host = await this.sandbox.getPreviewLink(3000);
    return `${host.url}/sse`;
  }

  async getSessionInfo(): Promise<any> {
    if (!this.sandbox || !this.sessionId) {
      throw new Error("Sandbox or session not initialized");
    }

    const session = await this.sandbox.process.getSession(this.sessionId);
    return session;
  }

  async start(): Promise<void> {
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized");
    }
    await this.sandbox.start();
  }

  async stop(): Promise<void> {
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized");
    }

    try {
      await this.sandbox.stop();
    } catch (error) {
      console.error("Error stopping sandbox:", error);
      throw error;
    }
  }

  async delete(): Promise<void> {
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized");
    }
    await this.sandbox.delete();
  }
}

export type { McpSandbox };