"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

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
