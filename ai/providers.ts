import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

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

// Helper to get Ollama endpoint from localStorage
const getOllamaEndpoint = (): string => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('OLLAMA_ENDPOINT') || 'http://localhost:11434/v1';
  }
  return 'http://localhost:11434/v1';
};

// // Create provider instances with API keys from localStorage
// // const openaiClient = createOpenAI({
// //   apiKey: getApiKey('OPENAI_API_KEY'),
// // });

const anthropicClient = createAnthropic({
  apiKey: getApiKey('ANTHROPIC_API_KEY'),
});

const groqClient = createGroq({
  apiKey: getApiKey('GROQ_API_KEY'),
});

const googleClient = createGoogleGenerativeAI({
  apiKey: getApiKey('GOOGLE_API_KEY'),
});

// const xaiClient = createXai({
//   apiKey: getApiKey('XAI_API_KEY'),
// });

// Create Ollama client using OpenAI client with custom base URL
const ollamaClient = createOpenAI({
  baseURL: getOllamaEndpoint(),
  apiKey: "ollama", // Ollama doesn't require a real API key, but the SDK requires some value
});

const languageModels = {
  // "gpt-4.1-mini": openaiClient("gpt-4.1-mini"),
  "claude-4-sonnet": anthropicClient('claude-sonnet-4-20250514'),
  "qwen-qwq": wrapLanguageModel(
    {
      model: groqClient("qwen-qwq-32b"),
      middleware
    }
  ),
  "gemini-1.5-pro": wrapLanguageModel(
    {
      model: googleClient("gemini-1.5-pro"),
      middleware
    }
  ),
  
  // Add Ollama models
  "ollama-llama3": wrapLanguageModel(
    {
      model: ollamaClient("llama3"),
      middleware
    }
  ),
  "ollama-mistral": wrapLanguageModel(
    {
      model: ollamaClient("mistral"),
      middleware
    }
  ),
  "ollama-phi3": wrapLanguageModel(
    {
      model: ollamaClient("phi3"),
      middleware
    }
  ),
  "ollama-qwen3-8b": wrapLanguageModel(
    {
      model: ollamaClient("qwen3:8b"),
      middleware
    }
  ),
};

// Add model information to modelDetails
export const modelDetails: Record<modelID, ModelInfo> = {

  "claude-4-sonnet": {
    provider: "Anthropic",
    name: "Claude 4 Sonnet",
    description: "Anthropic's Claude 4 Sonnet model with advanced reasoning capabilities.",
    apiVersion: "claude-4-sonnet-20250514",
    capabilities: ["Reasoning", "Creative", "Coding"]
  },
  "qwen-qwq": {
    provider: "Groq",
    name: "Qwen QWQ",
    description: "Latest version of Alibaba's Qwen QWQ with strong reasoning and coding capabilities.",
    apiVersion: "qwen-qwq",
    capabilities: ["Reasoning", "Efficient", "Agentic"]
  },
  "gemini-1.5-pro": {
    provider: "Google",
    name: "Gemini 1.5 Pro",
    description: "Google's Gemini 1.5 Pro with strong reasoning, coding, and multimodal capabilities.",
    apiVersion: "gemini-1.5-pro",
    capabilities: ["Reasoning", "Multimodal", "Creative"]
  },

  // Add Ollama model info
  "ollama-llama3": {
    provider: "Ollama",
    name: "Llama 3 (Local)",
    description: "Meta's Llama 3 model running locally through Ollama",
    apiVersion: "llama3",
    capabilities: ["Local", "Reasoning", "Coding"]
  },
  "ollama-mistral": {
    provider: "Ollama",
    name: "Mistral (Local)",
    description: "Mistral model running locally through Ollama",
    apiVersion: "mistral",
    capabilities: ["Local", "Reasoning"]
  },
  "ollama-phi3": {
    provider: "Ollama",
    name: "Phi-3 (Local)",
    description: "Microsoft's Phi-3 model running locally through Ollama",
    apiVersion: "phi3",
    capabilities: ["Local", "Efficient"]
  },
  "ollama-qwen3-8b": {
    provider: "Ollama",
    name: "Qwen 3 8B (Local)",
    description: "Alibaba's Qwen 3 8B reasoning model running locally through Ollama - powerful and efficient",
    apiVersion: "qwen3:8b",
    capabilities: ["Local", "Reasoning", "Coding", "Efficient"]
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

export const defaultModel: modelID = "qwen-qwq";
