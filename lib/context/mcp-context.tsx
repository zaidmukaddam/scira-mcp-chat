"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { startSandbox, stopSandbox } from "@/app/actions";

// Define types for MCP server
export interface KeyValuePair {
  key: string;
  value: string;
}

export type ServerStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

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
  status?: ServerStatus;
  errorMessage?: string;
}

// Type for processed MCP server config for API
export interface MCPServerApi {
  type: 'sse';
  url: string;
  headers?: KeyValuePair[];
}

interface SandboxInfo {
  id: string;
  url: string;
}

interface MCPContextType {
  mcpServers: MCPServer[];
  setMcpServers: (servers: MCPServer[]) => void;
  selectedMcpServers: string[];
  setSelectedMcpServers: (serverIds: string[]) => void;
  mcpServersForApi: MCPServerApi[];
  startServer: (serverId: string) => Promise<boolean>;
  stopServer: (serverId: string) => Promise<void>;
  updateServerStatus: (serverId: string, status: ServerStatus, errorMessage?: string) => void;
}

const MCPContext = createContext<MCPContextType | undefined>(undefined);

// Helper function to wait for server readiness
async function waitForServerReady(url: string, maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        console.log(`Server ready at ${url} after ${i + 1} attempts`);
        return true;
      }
      console.log(`Server not ready yet (attempt ${i + 1}), status: ${response.status}`);
    } catch {
      console.log(`Server connection failed (attempt ${i + 1})`);
    }
    // Wait between attempts
    await new Promise(resolve => setTimeout(resolve, 6000));
  }
  return false;
}

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
  
  // Keep a ref to active sandboxes (only their IDs and URLs)
  const sandboxesRef = useRef<SandboxInfo[]>([]);

  // Update server status
  const updateServerStatus = (serverId: string, status: ServerStatus, errorMessage?: string) => {
    setMcpServers(current => 
      current.map(server => 
        server.id === serverId 
          ? { ...server, status, errorMessage: errorMessage || undefined } 
          : server
      )
    );
  };
  
  // Start a server (if it's stdio type) using server actions
  const startServer = async (serverId: string): Promise<boolean> => {
    const server = mcpServers.find(s => s.id === serverId);
    if (!server) return false;
    
    // If it's already an SSE server, just update the status
    if (server.type === 'sse') {
      updateServerStatus(serverId, 'connecting');
      
      try {
        const isReady = await waitForServerReady(server.url);
        updateServerStatus(serverId, isReady ? 'connected' : 'error', 
          isReady ? undefined : 'Could not connect to server');
        return isReady;
      } catch (error) {
        updateServerStatus(serverId, 'error', `Connection error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }
    
    // For stdio type, start a sandbox via the server action
    if (server.type === 'stdio' && server.command && server.args?.length) {
      updateServerStatus(serverId, 'connecting');
      
      try {
        // Check if we already have a sandbox for this server
        const existingSandbox = sandboxesRef.current.find(s => s.id === serverId);
        if (existingSandbox) {
          try {
            // Test if the existing sandbox is still responsive
            const isReady = await waitForServerReady(existingSandbox.url);
            if (isReady) {
              updateServerStatus(serverId, 'connected');
              return true;
            }
            // If not responsive, we'll create a new one below
          } catch {
            // Sandbox wasn't responsive, continue to create a new one
          }
        }
        
        // Call the server action to create a sandbox
        const { url } = await startSandbox({
          id: serverId,
          command: server.command,
          args: server.args,
          env: server.env,
        });
        
        // Wait for the server to become ready
        const isReady = await waitForServerReady(url);
        if (!isReady) {
          updateServerStatus(serverId, 'error', 'Server failed to start in time');
          
          // Attempt to stop the sandbox since it's not working correctly
          try {
            await stopSandbox(serverId);
          } catch (stopError) {
            console.error('Failed to stop non-responsive sandbox:', stopError);
          }
          
          return false;
        }
        
        // Store the sandbox reference
        // Remove any existing sandbox for this server first
        sandboxesRef.current = sandboxesRef.current.filter(s => s.id !== serverId);
        sandboxesRef.current.push({ id: serverId, url });
        
        // Update the server URL to point to the sandbox SSE URL
        setMcpServers(current => 
          current.map(s => 
            s.id === serverId 
              ? { ...s, status: 'connected', errorMessage: undefined, url } 
              : s
          )
        );
        
        return true;
      } catch (error) {
        console.error('Error starting server:', error);
        updateServerStatus(serverId, 'error', `Startup error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }
    
    return false;
  };
  
  // Stop a server using the server action
  const stopServer = async (serverId: string): Promise<void> => {
    // Find the sandbox for this server
    const sandboxIndex = sandboxesRef.current.findIndex(s => s.id === serverId);
    if (sandboxIndex >= 0) {
      try {
        // Call server action to stop the sandbox
        await stopSandbox(serverId);
        console.log(`Stopped sandbox for server ${serverId}`);
      } catch (error) {
        console.error(`Error stopping sandbox for server ${serverId}:`, error);
      }
      
      // Remove from our tracking
      sandboxesRef.current.splice(sandboxIndex, 1);
    }
    
    // Update server status
    updateServerStatus(serverId, 'disconnected');
  };

  // Auto-start selected servers when they're added to the selection
  useEffect(() => {
    const startSelectedServers = async () => {
      for (const serverId of selectedMcpServers) {
        const server = mcpServers.find(s => s.id === serverId);
        if (server && (!server.status || server.status === 'disconnected')) {
          await startServer(serverId);
        }
      }
    };
    
    startSelectedServers();
    
    // Cleanup on unmount
    return () => {
      // Stop all running sandboxes
      sandboxesRef.current.forEach(async ({ id }) => {
        try {
          await stopSandbox(id);
        } catch (error) {
          console.error('Error stopping sandbox during cleanup:', error);
        }
      });
      sandboxesRef.current = [];
    };
  }, [selectedMcpServers]);

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
        // All servers are exposed as SSE type to the API
        type: 'sse',
        url: server.url,
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
        mcpServersForApi,
        startServer,
        stopServer,
        updateServerStatus
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