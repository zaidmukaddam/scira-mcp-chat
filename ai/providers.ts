import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { customProvider, wrapLanguageModel, extractReasoningMiddleware } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
export interface ModelInfo {
  provider: string;
  name: string;
  description: string;
  apiVersion: string;
  capabilities: string[];
}

const middleware = extractReasoningMiddleware({
  tagName: 'think',
});

const languageModels = {
  "gemini-2.5-flash": google("gemini-2.5-flash-preview-04-17"),
  "gpt-4.1-mini": openai("gpt-4.1-mini"),
  "claude-3-7-sonnet": anthropic('claude-3-7-sonnet-20250219'),
  "qwen-qwq": wrapLanguageModel(
    {
      model: groq("qwen-qwq-32b"),
      middleware
    }
  ),
};

export const modelDetails: Record<keyof typeof languageModels, ModelInfo> = {
  "gemini-2.5-flash": {
    provider: "Google",
    name: "Gemini 2.5 Flash",
    description: "Latest version of Google's Gemini 2.5 Flash with strong reasoning and coding capabilities.",
    apiVersion: "gemini-2.5-flash-preview-04-17",
    capabilities: ["Balance", "Efficient", "Agentic"]
  },
  "gpt-4.1-mini": {
    provider: "OpenAI",
    name: "GPT-4.1 Mini",
    description: "Compact version of OpenAI's GPT-4.1 with good balance of capabilities, including vision.",
    apiVersion: "gpt-4.1-mini",
    capabilities: ["Balance", "Creative", "Vision"]
  },
  "claude-3-7-sonnet": {
    provider: "Anthropic",
    name: "Claude 3.7 Sonnet",
    description: "Latest version of Anthropic's Claude 3.7 Sonnet with strong reasoning and coding capabilities.",
    apiVersion: "claude-3-7-sonnet-20250219",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
  "qwen-qwq": {
    provider: "Groq",
    name: "Qwen QWQ",
    description: "Latest version of Alibaba's Qwen QWQ with strong reasoning and coding capabilities.",
    apiVersion: "qwen-qwq",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
};

export const model = customProvider({
  languageModels,
});

export type modelID = keyof typeof languageModels;

export const MODELS = Object.keys(languageModels);

export const defaultModel: modelID = "qwen-qwq";
