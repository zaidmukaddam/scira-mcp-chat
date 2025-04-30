"use client";

import { useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import type { MCPServer } from "@/lib/context/mcp-context";

export function AutoInjectMCP() {
  const [mcpServers, setMcpServers] = useLocalStorage<MCPServer[]>(
    STORAGE_KEYS.MCP_SERVERS,
    []
  );
  const [selectedMcpServers, setSelectedMcpServers] = useLocalStorage<string[]>(
    STORAGE_KEYS.SELECTED_MCP_SERVERS,
    []
  );

  useEffect(() => {
    async function injectServers() {
      try {
        const res = await fetch("/api/mcp-config");
        if (!res.ok) throw new Error("Failed to fetch mcp-config");
        const data = await res.json();
        const servers = data.mcpServers || {};
        const newServers: MCPServer[] = [];
        const newSelected: string[] = [];
        Object.entries(servers).forEach(([id, config]) => {
        // Normalize env to always be an array of { key, value }
        let env = config.env;
        if (env && typeof env === "object" && !Array.isArray(env)) {
          env = Object.entries(env).map(([key, value]) => ({ key, value }));
        }
        // Merge id and normalized env into config
        const server: MCPServer = { id, ...config, env };
          // Add if not already present
          if (!mcpServers.some(s => s.id === id)) {
            newServers.push(server);
          }
          // Auto-enable if specified
          if (config.autoEnable && !selectedMcpServers.includes(id)) {
            newSelected.push(id);
          }
        });
        if (newServers.length > 0) {
          setMcpServers([...mcpServers, ...newServers]);
        }
        if (newSelected.length > 0) {
          setSelectedMcpServers([...selectedMcpServers, ...newSelected]);
        }
      } catch (e) {
        console.error("AutoInjectMCP failed to inject servers:", e);
      }
    }
    injectServers();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}