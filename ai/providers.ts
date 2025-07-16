import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";

import {
  customProvider,
  wrapLanguageModel,
  extractReasoningMiddleware
} from "ai";

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

// Helper to get API keys from environment variables first, then localStorage
const getApiKey = (key: string): string | undefined => {
  // Check for environment variables first
  if (process.env[key]) {
    return process.env[key] || undefined;
  }

  // Fall back to localStorage if available
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(key) || undefined;
  }

  return undefined;
};

// Create provider instances with API keys from localStorage
const openaiClient = createOpenAI({
  apiKey: getApiKey('OPENAI_API_KEY'),
});

const anthropicClient = createAnthropic({
  apiKey: getApiKey('ANTHROPIC_API_KEY'),
});

const groqClient = createGroq({
  apiKey: getApiKey('GROQ_API_KEY'),
});

const xaiClient = createXai({
  apiKey: getApiKey('XAI_API_KEY'),
});

const languageModels = {
  "gpt-4.1-mini": openaiClient("gpt-4.1-mini"),
  "claude-4-sonnet": anthropicClient('claude-4-sonnet-20250514'),
  "qwen-32b": wrapLanguageModel(
    {
      model: groqClient('qwen/qwen-32b'),
      middleware
    }
  ),
  "grok-3-mini": xaiClient("grok-3-mini-latest"),
};

export const modelDetails: Record<keyof typeof languageModels, ModelInfo> = {
  "gpt-4.1-mini": {
    provider: "OpenAI",
    name: "GPT-4.1 Mini",
    description: "Compact version of OpenAI's GPT-4.1 with good balance of capabilities, including vision.",
    apiVersion: "gpt-4.1-mini",
    capabilities: ["Balance", "Creative", "Vision"]
  },
  "claude-4-sonnet": {
    provider: "Anthropic",
    name: "Claude 4 Sonnet",
    description: "Latest version of Anthropic's Claude 4 Sonnet with strong reasoning and coding capabilities.",
    apiVersion: "claude-4-sonnet-20250514",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
  "qwen-32b": {
    provider: "Groq",
    name: "Qwen 32B",
    description: "Latest version of Alibaba's Qwen 32B with strong reasoning and coding capabilities.",
    apiVersion: "qwen-32b",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
  "grok-3-mini": {
    provider: "XAI",
    name: "Grok 3 Mini",
    description: "Latest version of XAI's Grok 3 Mini with strong reasoning and coding capabilities.",
    apiVersion: "grok-3-mini-latest",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
};

// Update API keys when localStorage changes (for runtime updates)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    // Reload the page if any API key changed to refresh the providers
    if (event.key?.includes('API_KEY')) {
      window.location.reload();
    }
  });
}

export const model = customProvider({
  languageModels,
});

export type modelID = keyof typeof languageModels;

export const MODELS = Object.keys(languageModels);

  export const defaultModel: modelID = "qwen-32b";
