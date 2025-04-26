"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { STORAGE_KEYS } from "@/lib/constants";

// Define types for MCP server
export interface KeyValuePair {
  key: string;
  value: string;
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  type: 'sse' | 'stdio';
  command?: string;
  args?: string[];
  env?: KeyValuePair[];
  headers?: KeyValuePair[];
  description?: string;
}

// Type for processed MCP server config for API
export interface MCPServerApi {
  type: 'sse' | 'stdio';
  url: string;
  command?: string;
  args?: string[];
  env?: KeyValuePair[];
  headers?: KeyValuePair[];
}

interface MCPContextType {
  mcpServers: MCPServer[];
  setMcpServers: (servers: MCPServer[]) => void;
  selectedMcpServers: string[];
  setSelectedMcpServers: (serverIds: string[]) => void;
  mcpServersForApi: MCPServerApi[];
}

const MCPContext = createContext<MCPContextType | undefined>(undefined);

export function MCPProvider(props: { children: React.ReactNode }) {
  const { children } = props;
  const [mcpServers, setMcpServers] = useLocalStorage<MCPServer[]>(
    STORAGE_KEYS.MCP_SERVERS, 
    []
  );
  const [selectedMcpServers, setSelectedMcpServers] = useLocalStorage<string[]>(
    STORAGE_KEYS.SELECTED_MCP_SERVERS, 
    []
  );
  const [mcpServersForApi, setMcpServersForApi] = useState<MCPServerApi[]>([]);

  // Process MCP servers for API consumption whenever server data changes
  useEffect(() => {
    if (!selectedMcpServers.length) {
      setMcpServersForApi([]);
      return;
    }
    
    const processedServers: MCPServerApi[] = selectedMcpServers
      .map(id => mcpServers.find(server => server.id === id))
      .filter((server): server is MCPServer => Boolean(server))
      .map(server => ({
        type: server.type,
        url: server.url,
        command: server.command,
        args: server.args,
        env: server.env,
        headers: server.headers
      }));
    
    setMcpServersForApi(processedServers);
  }, [mcpServers, selectedMcpServers]);

  return (
    <MCPContext.Provider 
      value={{ 
        mcpServers, 
        setMcpServers, 
        selectedMcpServers, 
        setSelectedMcpServers,
        mcpServersForApi 
      }}
    >
      {children}
    </MCPContext.Provider>
  );
}

export function useMCP() {
  const context = useContext(MCPContext);
  if (context === undefined) {
    throw new Error("useMCP must be used within an MCPProvider");
  }
  return context;
} 