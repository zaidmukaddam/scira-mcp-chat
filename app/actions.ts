"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { startMcpSandbox } from '@/lib/mcp-sandbox';

// Use a global map to store active sandbox instances across requests
const activeSandboxes = (global as any).activeSandboxes || new Map();
(global as any).activeSandboxes = activeSandboxes;

// Helper to extract text content from a message regardless of format
function getMessageText(message: any): string {
  // Check if the message has parts (new format)
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts.filter((p: any) => p.type === 'text' && p.text);
    if (textParts.length > 0) {
      return textParts.map((p: any) => p.text).join('\n');
    }
  }
  
  // Fallback to content (old format)
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  // If content is an array (potentially of parts), try to extract text
  if (Array.isArray(message.content)) {
    const textItems = message.content.filter((item: any) => 
      typeof item === 'string' || (item.type === 'text' && item.text)
    );
    
    if (textItems.length > 0) {
      return textItems.map((item: any) => 
        typeof item === 'string' ? item : item.text
      ).join('\n');
    }
  }
  
  return '';
}

export async function generateTitle(messages: any[]) {
  // Convert messages to a format that OpenAI can understand
  const normalizedMessages = messages.map(msg => ({
    role: msg.role,
    content: getMessageText(msg)
  }));
  
  const { object } = await generateObject({
    model: openai("gpt-4.1"),
    schema: z.object({
      title: z.string().min(1).max(100),
    }),
    system: `
    You are a helpful assistant that generates titles for chat conversations.
    The title should be a short description of the conversation.
    The title should be no more than 30 characters.
    The title should be unique and not generic.
    `,
    messages: [
      ...normalizedMessages,
      {
        role: "user",
        content: "Generate a title for the conversation.",
      },
    ],
  });

  return object.title;
}

export interface KeyValuePair {
  key: string;
  value: string;
}

/**
 * Server action to start a sandbox
 */
export async function startSandbox(params: {
  id: string;
  command: string;
  args: string[];
  env?: KeyValuePair[];
}): Promise<{ url: string }> {
  const { id, command, args, env } = params;
  
  // Validate required fields
  if (!id || !command || !args) {
    throw new Error('Missing required fields');
  }
  
  // Check if we already have a sandbox for this ID
  if (activeSandboxes.has(id)) {
    // If we do, get the URL and return it without creating a new sandbox
    const existingSandbox = activeSandboxes.get(id);
    return { url: existingSandbox.url };
  }
  
  // Build the command string
  let cmd: string;
  
  // Prepare the command based on the type of executable
  if (command === 'uvx') {
    // For uvx, use the direct format
    const toolName = args[0];
    cmd = `uvx ${toolName} ${args.slice(1).join(' ')}`;
  } else if (command.includes('python')) {
    // For python commands
    cmd = `${command} ${args.join(' ')}`;
  } else {
    // For node or other commands
    cmd = `${command} ${args.join(' ')}`;
  }
  
  // Convert env array to object if needed
  const envs: Record<string, string> = {};
  if (env && env.length > 0) {
    env.forEach((envVar) => {
      if (envVar.key) envs[envVar.key] = envVar.value || '';
    });
  }
  
  // Start the sandbox
  console.log(`Starting sandbox for ${id} with command: ${cmd}`);
  const sandbox = await startMcpSandbox({ cmd, envs });
  const url = await sandbox.getUrl();
  
  // Store the sandbox in our map
  activeSandboxes.set(id, { sandbox, url });
  
  return { url };
}

/**
 * Server action to stop a sandbox
 */
export async function stopSandbox(id: string): Promise<{ success: boolean }> {
  if (!id) {
    throw new Error('Missing sandbox ID');
  }
  
  // Check if we have a sandbox with this ID
  if (!activeSandboxes.has(id)) {
    throw new Error(`No active sandbox found with ID: ${id}`);
  }
  
  // Stop the sandbox
  const { sandbox } = activeSandboxes.get(id);
  
  try {
    await sandbox.stop();
    console.log(`Stopped sandbox with ID: ${id}`);
  } catch (stopError) {
    console.error(`Error stopping sandbox ${id}:`, stopError);
    // Continue to remove from the map even if stop fails
  }
  
  // Remove from our map
  activeSandboxes.delete(id);
  
  return { success: true };
}
