
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Core AI and chat imports
import { model, type modelID } from "./ai/providers";
import { smoothStream, streamText, type UIMessage } from "ai";
import { appendResponseMessages } from "ai";
import { saveChat, saveMessages, convertToDBMessages } from "./lib/chat-store";
import { nanoid } from "nanoid";
import { db } from "./lib/db";
import { chats } from "./lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateTitle } from "./lib/actions";

// MCP and Sandbox imports
import { initializeMCPClients, type MCPServerConfig } from "./lib/mcp-client"; // Now used in /api/chat
import { startMcpSandbox, type McpSandbox } from "./lib/mcp-sandbox"; // For sandbox routes

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const activeSandboxes = new Map<string, { sandbox: McpSandbox, url: string }>();

app.post("/api/chat", async (req: express.Request, res: express.Response) => {
  try {
    const {
      messages,
      chatId: initialChatId,
      selectedModel,
      userId,
      mcpServers = [],
    }: {
      messages: UIMessage[];
      chatId?: string;
      selectedModel: modelID;
      userId: string;
      mcpServers?: MCPServerConfig[];
    } = req.body;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const id = initialChatId || nanoid();
    let isNewChat = false;
    if (initialChatId) {
      try {
        const existingChat = await db.query.chats.findFirst({
          where: and(eq(chats.id, initialChatId), eq(chats.userId, userId)),
        });
        isNewChat = !existingChat;
      } catch (error) { console.error("Error checking for existing chat:", error); isNewChat = true; }
    } else { isNewChat = true; }

    if (isNewChat && messages.length > 0) {
      try {
        const userMessage = messages.find(m => m.role === "user");
        let title = "New Chat";
        if (userMessage) {
          try { title = await generateTitle([userMessage]); }
          catch (error) { console.error("Error generating title:", error); }
        }
        await saveChat({ id, userId, title, messages: [] });
      } catch (error) { console.error("Error saving new chat:", error); }
    }

    const abortController = new AbortController();
    let responseCompleted = false; // Moved up to be accessible in req.on(close) for cleanup logic

    req.on("close", () => {
      if (!responseCompleted) {
        console.log("Request aborted by client, cleaning up MCP resources and aborting stream.");
        if (typeof mcpCleanup === "function") mcpCleanup(); // Check if mcpCleanup is defined
        abortController.abort();
      }
    });

    const { tools, cleanup: mcpCleanup } = await initializeMCPClients(mcpServers, abortController.signal);

    const result = streamText({
      model: model.languageModel(selectedModel),
      system: `You are a helpful assistant... (system prompt from original)`,
      messages,
      tools,
      maxSteps: 20,
      providerOptions: { },
      experimental_transform: smoothStream({ delayInMs: 5, chunking: "line" }),
      onError: (error) => { console.error("Error from streamText:", JSON.stringify(error, null, 2)); },
      async onFinish({ response }) {
        responseCompleted = true;
        const allMessages = appendResponseMessages({ messages, responseMessages: response.messages });
        await saveChat({ id, userId, messages: allMessages });
        const dbMessages = convertToDBMessages(allMessages, id);
        await saveMessages({ messages: dbMessages });
        await mcpCleanup();
      },
      // signal: abortController.signal, // Removed as it causes TS2353; AbortController is used by req.on('close')
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Chat-ID", id);

    (async () => {
      try {
        for await (const chunk of result.textStream) { // Changed from readableStream to textStream
          res.write(chunk);
        }
        res.end();
      } catch (error) {
        if (!responseCompleted) {
            console.error("Error streaming data to response:", error);
            if (!res.headersSent) { res.status(500).send("Error streaming response"); }
            else { res.end(); }
        }
      }
    })();

  } catch (error) {
    console.error("Error in /api/chat handler:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error in chat processing" });
    } else {
      res.end();
    }
    return; // Ensure function exits if error is caught and handled
  }
});

app.post("/api/sandbox/start", async (req: express.Request, res: express.Response) => {
  const { id, command, args, env } = req.body as { id: string; command: string; args: string[]; env?: Array<{key: string, value: string}> };
  console.log(`[Sandbox Start API] Received request for ID: ${id}`);

  if (!id || !command || !args) {
    res.status(400).json({ error: "Missing required fields: id, command, args" });
    return;
  }

  if (activeSandboxes.has(id)) {
    const existing = activeSandboxes.get(id)!;
    try {
      const freshUrl = await existing.sandbox.getUrl();
      console.log(`[Sandbox Start API] Reusing existing sandbox for ${id}, URL: ${freshUrl}`);
      activeSandboxes.set(id, { sandbox: existing.sandbox, url: freshUrl });
      res.json({ url: freshUrl });
      return;
    } catch (error) {
      console.error(`[Sandbox Start API] Error refreshing sandbox URL for ${id}:`, error);
      activeSandboxes.delete(id);
    }
  }

  const envs: Record<string, string> = {};
  if (env && env.length > 0) {
    env.forEach((envVar) => {
      if (envVar.key) envs[envVar.key] = envVar.value || "";
    });
  }

  try {
    console.log(`[Sandbox Start API] Creating new sandbox for ${id} with command: ${command} ${args.join(" ")}`);
    const sandboxInstance = await startMcpSandbox({ cmd: `${command} ${args.join(" ")}`, envs });
    const url = await sandboxInstance.getUrl();
    console.log(`[Sandbox Start API] Sandbox created for ${id}, URL: ${url}`);
    activeSandboxes.set(id, { sandbox: sandboxInstance, url });
    res.json({ url });
    return;
  } catch (error) {
    console.error(`[Sandbox Start API] Error starting sandbox ${id}:`, error);
    res.status(500).json({ error: "Failed to start sandbox", details: error instanceof Error ? error.message : String(error) });
    return;
  }
});

app.post("/api/sandbox/stop", async (req: express.Request, res: express.Response) => {
  const { id } = req.body as { id: string };
  console.log(`[Sandbox Stop API] Received request for ID: ${id}`);

  if (!id) {
    res.status(400).json({ error: "Missing sandbox ID" });
    return;
  }

  if (!activeSandboxes.has(id)) {
    res.status(404).json({ error: `No active sandbox found with ID: ${id}` });
    return;
  }

  const { sandbox } = activeSandboxes.get(id)!;
  try {
    await sandbox.stop();
    console.log(`[Sandbox Stop API] Stopped sandbox with ID: ${id}`);
  } catch (stopError) {
    console.error(`[Sandbox Stop API] Error stopping sandbox ${id}:`, stopError);
  } finally {
    activeSandboxes.delete(id);
  }

  res.json({ success: true });
  return;
});

app.post("/api/title/generate", async (req: express.Request, res: express.Response) => {
  const { messages } = req.body;
  if (!messages) {
    res.status(400).json({ error: "Messages are required to generate a title." });
    return;
  }
  try {
    const title = await generateTitle(messages);
    res.json({ title });
    return;
  } catch (error) {
    console.error("Error in /api/title/generate handler:", error);
    res.status(500).json({ error: "Failed to generate title" });
    return;
  }
});

app.get("/api/chats/:chatId", (req, res) => { res.status(501).send("Not Implemented"); });
app.get("/api/chats", (req, res) => { res.status(501).send("Not Implemented"); });
app.delete("/api/chats/:chatId", (req, res) => { res.status(501).send("Not Implemented"); });

app.get("/", (req, res) => { res.send("Hello from the new server! API is alive."); });

app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});

export { app, activeSandboxes };
