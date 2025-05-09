// import Sandbox from "@e2b/code-interpreter";
import { Daytona, Sandbox, SandboxTargetRegion } from "@daytonaio/sdk";

export const startMcpSandbox = async ({
  cmd,
  envs = {},
}: {
  cmd: string
  envs?: Record<string, string>
}) => {
  console.log("Creating sandbox...");
  const daytona = new Daytona();
  const sandbox = await daytona.create({
    resources: {
      cpu: 2,
      memory: 4,
      disk: 5,
    },
    public: true,
    autoStopInterval: 0, // 24 hours
    timeout: 1000 * 300, // 5 minutes
    envVars: {
      ...envs,
    },
  });

  const host = await sandbox.getPreviewLink(3000);
  const url = host.url;
  const token = host.token;
  console.log("url", url);
  console.log("token", token);

  const sessionId = Math.random().toString(36).substring(2, 30);
  await sandbox.process.createSession(sessionId);
  // python -m mcp_server_time --local-timezone=Asia/Kolkata
  const isPythonCommand = cmd.startsWith('python') || cmd.startsWith('python3');
  let installResult = null;
  
  if (isPythonCommand) {
    const packageName = cmd.split("-m ")[1]?.split(" ")[0] || "";
    if (packageName) {
      console.log(`Installing Python package: ${packageName}`);
      const installUv = await sandbox.process.executeSessionCommand(sessionId, {
        // Install python package from the command after -m in the command
        command: `pip install ${packageName}`,
        runAsync: true,
      },
        1000 * 300 // 5 minutes
      );
      console.log("install result", installUv.output);
      if (installUv.exitCode !== 0) {
        console.error("Failed to install package");
      }
      installResult = installUv;
    }
  }
  
  console.log("Starting mcp server...");
  // generate a session with random id
  const mcpServer = await sandbox.process.executeSessionCommand(sessionId,
    {
      command: `npx -y supergateway --base-url ${url} --header "x-daytona-preview-token: ${token}" --port 3000 --cors --stdio "${cmd}"`,
      runAsync: true,
    },
    1000 * 300 // 5 minutes
  );
  console.log("mcp server result", mcpServer.output);
  const session = await sandbox.process.getSession(sessionId);
  console.log(`Session ${sessionId}:`);
  for (const command of session.commands || []) {
    console.log(`Command: ${command.command}, Exit Code: ${command.exitCode}`);
  }
  if (mcpServer.exitCode !== 0) {
    console.error("Failed to start mcp server. Exit code:", mcpServer.exitCode);
  }

  console.log("MCP server started at:", url + "/sse");
  return new McpSandbox(sandbox);
}

class McpSandbox {
  public sandbox: Sandbox;

  constructor(sandbox: Sandbox) {
    this.sandbox = sandbox;
  }

  async getUrl(): Promise<string> {
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized");
    }
    const host = await this.sandbox.getPreviewLink(3000);
    return `${host.url}/sse`;
  }

  async stop(): Promise<void> {
    await this.sandbox.delete();
  }
}

export type { McpSandbox };