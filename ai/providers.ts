import { xai } from "@ai-sdk/xai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { customProvider, wrapLanguageModel, extractReasoningMiddleware } from "ai";

export interface ModelInfo {
  provider: string;
  name: string;
  description: string;
  apiVersion: string;
  capabilities: string[];
}

const middleware = extractReasoningMiddleware({
  tagName: 'reasoning',
  separator: '\n',
});

const languageModels = {
  // "grok-3": xai("grok-3-latest"),
  // "grok-3-mini": xai("grok-3-mini-fast-latest"),
  "gpt-4.1-mini": openai("gpt-4.1-mini"),
  "gpt-4.1-nano": openai("gpt-4.1-nano"),
  "gemini-2-flash": google("gemini-2.0-flash-001"),
  "qwen-qwq": wrapLanguageModel(
    {
      model: groq("qwen-qwq-32b"), 
      middleware
    }
  )
};

export const modelDetails: Record<keyof typeof languageModels, ModelInfo> = {
  // "grok-3": {
  //   provider: "xAI",
  //   name: "Grok-3",
  //   description: "Latest version of xAI's flagship model with strong reasoning and coding capabilities.",
  //   apiVersion: "grok-3-latest",
  //   capabilities: ["Balance", "Efficient", "Agentic"]
  // },
  // "grok-3-mini": {
  //   provider: "xAI",
  //   name: "Grok-3 Mini",
  //   description: "Fast, efficient and smaller xAI model with reasoning capabilities.",
  //   apiVersion: "grok-3-mini-fast-latest",
  //   capabilities: ["Fast","Reasoning", "Efficient"]
  // },
  "gpt-4.1-mini": {
    provider: "OpenAI",
    name: "GPT-4.1 Mini",
    description: "Compact version of OpenAI's GPT-4.1 with good balance of capabilities, including vision.",
    apiVersion: "gpt-4.1-mini",
    capabilities: [ "Balance", "Creative", "Vision"]
  },
  "gpt-4.1-nano": {
    provider: "OpenAI",
    name: "GPT-4.1 Nano",
    description: "Smallest and fastest GPT-4.1 variant designed for efficient rapid responses.",
    apiVersion: "gpt-4.1-nano",
    capabilities: ["Rapid", "Compact", "Efficient", "Vision"]
  },  
  "gemini-2-flash": {
    provider: "Google",
    name: "Gemini 2 Flash",
    description: "Latest version of Google's Gemini 2 with strong reasoning and coding capabilities.",
    apiVersion: "gemini-2-flash",
    capabilities: ["Balance", "Efficient", "Agentic"]
  },
  "qwen-qwq": {
    provider: "Groq",
    name: "Qwen QWQ",
    description: "Latest version of Alibaba's Qwen QWQ with strong reasoning and coding capabilities.",
    apiVersion: "qwen-qwq",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  }
};

export const model = customProvider({
  languageModels,
});

export type modelID = keyof typeof languageModels;

export const MODELS = Object.keys(languageModels);

export const defaultModel: modelID = "qwen-qwq";
