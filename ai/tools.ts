import { VercelAIToolSet } from "composio-core";

const toolset = new VercelAIToolSet();

export const composioTools = await toolset.getTools(
  { 
    apps: [
      "tavily",
    ]
  }
);