"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    PlusCircle,
    ServerIcon,
    X,
    Terminal,
    Globe,
    ExternalLink,
    Trash2,
    CheckCircle,
    Plus,
    Cog,
    Edit2,
    Eye,
    EyeOff
} from "lucide-react";
import { toast } from "sonner";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "./ui/accordion";
import { KeyValuePair, MCPServer } from "@/lib/context/mcp-context";

// Default template for a new MCP server
const INITIAL_NEW_SERVER: Omit<MCPServer, 'id'> = {
    name: '',
    url: '',
    type: 'sse',
    command: 'node',
    args: [],
    env: [],
    headers: []
};

interface MCPServerManagerProps {
    servers: MCPServer[];
    onServersChange: (servers: MCPServer[]) => void;
    selectedServers: string[];
    onSelectedServersChange: (serverIds: string[]) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Check if a key name might contain sensitive information
const isSensitiveKey = (key: string): boolean => {
    const sensitivePatterns = [
        /key/i, 
        /token/i, 
        /secret/i, 
        /password/i, 
        /pass/i,
        /auth/i,
        /credential/i
    ];
    return sensitivePatterns.some(pattern => pattern.test(key));
};

// Mask a sensitive value
const maskValue = (value: string): string => {
    if (!value) return '';
    if (value.length < 8) return '••••••';
    return value.substring(0, 3) + '•'.repeat(Math.min(10, value.length - 4)) + value.substring(value.length - 1);
};

export const MCPServerManager = ({
    servers,
    onServersChange,
    selectedServers,
    onSelectedServersChange,
    open,
    onOpenChange
}: MCPServerManagerProps) => {
    const [newServer, setNewServer] = useState<Omit<MCPServer, 'id'>>(INITIAL_NEW_SERVER);
    const [view, setView] = useState<'list' | 'add'>('list');
    const [newEnvVar, setNewEnvVar] = useState<KeyValuePair>({ key: '', value: '' });
    const [newHeader, setNewHeader] = useState<KeyValuePair>({ key: '', value: '' });
    const [editingServerId, setEditingServerId] = useState<string | null>(null);
    const [showSensitiveEnvValues, setShowSensitiveEnvValues] = useState<Record<number, boolean>>({});
    const [showSensitiveHeaderValues, setShowSensitiveHeaderValues] = useState<Record<number, boolean>>({});
    const [editingEnvIndex, setEditingEnvIndex] = useState<number | null>(null);
    const [editingHeaderIndex, setEditingHeaderIndex] = useState<number | null>(null);
    const [editedEnvValue, setEditedEnvValue] = useState<string>('');
    const [editedHeaderValue, setEditedHeaderValue] = useState<string>('');

    const resetAndClose = () => {
        setView('list');
        setNewServer(INITIAL_NEW_SERVER);
        setNewEnvVar({ key: '', value: '' });
        setNewHeader({ key: '', value: '' });
        setShowSensitiveEnvValues({});
        setShowSensitiveHeaderValues({});
        setEditingEnvIndex(null);
        setEditingHeaderIndex(null);
        onOpenChange(false);
    };

    const addServer = () => {
        if (!newServer.name) {
            toast.error("Server name is required");
            return;
        }

        if (newServer.type === 'sse' && !newServer.url) {
            toast.error("Server URL is required for SSE transport");
            return;
        }

        if (newServer.type === 'stdio' && (!newServer.command || !newServer.args?.length)) {
            toast.error("Command and at least one argument are required for stdio transport");
            return;
        }

        const id = crypto.randomUUID();
        const updatedServers = [...servers, { ...newServer, id }];
        onServersChange(updatedServers);

        toast.success(`Added MCP server: ${newServer.name}`);
        setView('list');
        setNewServer(INITIAL_NEW_SERVER);
        setNewEnvVar({ key: '', value: '' });
        setNewHeader({ key: '', value: '' });
        setShowSensitiveEnvValues({});
        setShowSensitiveHeaderValues({});
    };

    const removeServer = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedServers = servers.filter(server => server.id !== id);
        onServersChange(updatedServers);

        // If the removed server was selected, remove it from selected servers
        if (selectedServers.includes(id)) {
            onSelectedServersChange(selectedServers.filter(serverId => serverId !== id));
        }

        toast.success("Server removed");
    };

    const toggleServer = (id: string) => {
        if (selectedServers.includes(id)) {
            // Remove from selected servers
            onSelectedServersChange(selectedServers.filter(serverId => serverId !== id));
            const server = servers.find(s => s.id === id);
            if (server) {
                toast.success(`Disabled MCP server: ${server.name}`);
            }
        } else {
            // Add to selected servers
            onSelectedServersChange([...selectedServers, id]);
            const server = servers.find(s => s.id === id);
            if (server) {
                toast.success(`Enabled MCP server: ${server.name}`);
            }
        }
    };

    const clearAllServers = () => {
        if (selectedServers.length > 0) {
            onSelectedServersChange([]);
            toast.success("All MCP servers disabled");
            resetAndClose();
        }
    };

    const handleArgsChange = (value: string) => {
        try {
            // Try to parse as JSON if it starts with [ (array)
            const argsArray = value.trim().startsWith('[')
                ? JSON.parse(value)
                : value.split(' ').filter(Boolean);

            setNewServer({ ...newServer, args: argsArray });
        } catch (error) {
            // If parsing fails, just split by spaces
            setNewServer({ ...newServer, args: value.split(' ').filter(Boolean) });
        }
    };

    const addEnvVar = () => {
        if (!newEnvVar.key) return;

        setNewServer({
            ...newServer,
            env: [...(newServer.env || []), { ...newEnvVar }]
        });

        setNewEnvVar({ key: '', value: '' });
    };

    const removeEnvVar = (index: number) => {
        const updatedEnv = [...(newServer.env || [])];
        updatedEnv.splice(index, 1);
        setNewServer({ ...newServer, env: updatedEnv });
        
        // Clean up visibility state for this index
        const updatedVisibility = { ...showSensitiveEnvValues };
        delete updatedVisibility[index];
        setShowSensitiveEnvValues(updatedVisibility);
        
        // If currently editing this value, cancel editing
        if (editingEnvIndex === index) {
            setEditingEnvIndex(null);
        }
    };

    const startEditEnvValue = (index: number, value: string) => {
        setEditingEnvIndex(index);
        setEditedEnvValue(value);
    };

    const saveEditedEnvValue = () => {
        if (editingEnvIndex !== null) {
            const updatedEnv = [...(newServer.env || [])];
            updatedEnv[editingEnvIndex] = {
                ...updatedEnv[editingEnvIndex],
                value: editedEnvValue
            };
            setNewServer({ ...newServer, env: updatedEnv });
            setEditingEnvIndex(null);
        }
    };

    const addHeader = () => {
        if (!newHeader.key) return;

        setNewServer({
            ...newServer,
            headers: [...(newServer.headers || []), { ...newHeader }]
        });

        setNewHeader({ key: '', value: '' });
    };

    const removeHeader = (index: number) => {
        const updatedHeaders = [...(newServer.headers || [])];
        updatedHeaders.splice(index, 1);
        setNewServer({ ...newServer, headers: updatedHeaders });
        
        // Clean up visibility state for this index
        const updatedVisibility = { ...showSensitiveHeaderValues };
        delete updatedVisibility[index];
        setShowSensitiveHeaderValues(updatedVisibility);
        
        // If currently editing this value, cancel editing
        if (editingHeaderIndex === index) {
            setEditingHeaderIndex(null);
        }
    };

    const startEditHeaderValue = (index: number, value: string) => {
        setEditingHeaderIndex(index);
        setEditedHeaderValue(value);
    };

    const saveEditedHeaderValue = () => {
        if (editingHeaderIndex !== null) {
            const updatedHeaders = [...(newServer.headers || [])];
            updatedHeaders[editingHeaderIndex] = {
                ...updatedHeaders[editingHeaderIndex],
                value: editedHeaderValue
            };
            setNewServer({ ...newServer, headers: updatedHeaders });
            setEditingHeaderIndex(null);
        }
    };

    const toggleSensitiveEnvValue = (index: number) => {
        setShowSensitiveEnvValues(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const toggleSensitiveHeaderValue = (index: number) => {
        setShowSensitiveHeaderValues(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const hasAdvancedConfig = (server: MCPServer) => {
        return (server.env && server.env.length > 0) ||
            (server.headers && server.headers.length > 0);
    };

    // Editing support
    const startEditing = (server: MCPServer) => {
        setEditingServerId(server.id);
        setNewServer({
            name: server.name,
            url: server.url,
            type: server.type,
            command: server.command,
            args: server.args,
            env: server.env,
            headers: server.headers
        });
        setView('add');
        // Reset sensitive value visibility states
        setShowSensitiveEnvValues({});
        setShowSensitiveHeaderValues({});
        setEditingEnvIndex(null);
        setEditingHeaderIndex(null);
    };

    const handleFormCancel = () => {
        if (view === 'add') {
            setView('list');
            setEditingServerId(null);
            setNewServer(INITIAL_NEW_SERVER);
            setShowSensitiveEnvValues({});
            setShowSensitiveHeaderValues({});
            setEditingEnvIndex(null);
            setEditingHeaderIndex(null);
        } else {
            resetAndClose();
        }
    };

    const updateServer = () => {
        if (!newServer.name) {
            toast.error("Server name is required");
            return;
        }
        if (newServer.type === 'sse' && !newServer.url) {
            toast.error("Server URL is required for SSE transport");
            return;
        }
        if (newServer.type === 'stdio' && (!newServer.command || !newServer.args?.length)) {
            toast.error("Command and at least one argument are required for stdio transport");
            return;
        }
        const updated = servers.map(s =>
            s.id === editingServerId ? { ...newServer, id: editingServerId! } : s
        );
        onServersChange(updated);
        toast.success(`Updated MCP server: ${newServer.name}`);
        setView('list');
        setEditingServerId(null);
        setNewServer(INITIAL_NEW_SERVER);
        setShowSensitiveEnvValues({});
        setShowSensitiveHeaderValues({});
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ServerIcon className="h-5 w-5 text-primary" />
                        MCP Server Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Connect to Model Context Protocol servers to access additional AI tools.
                        {selectedServers.length > 0 && (
                            <span className="block mt-1 text-xs font-medium text-primary">
                                {selectedServers.length} server{selectedServers.length !== 1 ? 's' : ''} currently active
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {view === 'list' ? (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {servers.length > 0 ? (
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <div className="flex-1 overflow-hidden flex flex-col">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium">Available Servers</h3>
                                        <span className="text-xs text-muted-foreground">
                                            Select multiple servers to combine their tools
                                        </span>
                                    </div>
                                    <div className="overflow-y-auto pr-1 flex-1 gap-2.5 flex flex-col pb-16">
                                        {servers
                                            .sort((a, b) => {
                                                const aActive = selectedServers.includes(a.id);
                                                const bActive = selectedServers.includes(b.id);
                                                if (aActive && !bActive) return -1;
                                                if (!aActive && bActive) return 1;
                                                return 0;
                                            })
                                            .map((server) => {
                                            const isActive = selectedServers.includes(server.id);
                                            return (
                                                <div
                                                    key={server.id}
                                                    className={`
                            relative flex flex-col p-3.5 rounded-xl transition-colors
                            border ${isActive
                                                            ? 'border-primary bg-primary/10'
                                                            : 'border-border hover:border-primary/30 hover:bg-primary/5'}
                          `}
                                                >
                                                    {/* Server Header with Type Badge and Delete Button */}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {server.type === 'sse' ? (
                                                                <Globe className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'} flex-shrink-0`} />
                                                            ) : (
                                                                <Terminal className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'} flex-shrink-0`} />
                                                            )}
                                                            <h4 className="text-sm font-medium truncate max-w-[220px]">{server.name}</h4>
                                                            {hasAdvancedConfig(server) && (
                                                                <span className="flex-shrink-0">
                                                                    <Cog className="h-3 w-3 text-muted-foreground" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                                                {server.type.toUpperCase()}
                                                            </span>
                                                            <button
                                                                onClick={(e) => removeServer(server.id, e)}
                                                                className="p-1 rounded-full hover:bg-muted/70"
                                                                aria-label="Remove server"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                            </button>
                                                            <button
                                                                onClick={() => startEditing(server)}
                                                                className="p-1 rounded-full hover:bg-muted/50"
                                                                aria-label="Edit server"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Server Details */}
                                                    <p className="text-xs text-muted-foreground mb-2.5 truncate">
                                                        {server.type === 'sse'
                                                            ? server.url
                                                            : `${server.command} ${server.args?.join(' ')}`
                                                        }
                                                    </p>

                                                    {/* Action Button */}
                                                    <Button
                                                        size="sm"
                                                        className="w-full gap-1.5 hover:text-black hover:dark:text-white rounded-lg"
                                                        variant={isActive ? "default" : "outline"}
                                                        onClick={() => toggleServer(server.id)}
                                                    >
                                                        {isActive && <CheckCircle className="h-3.5 w-3.5" />}
                                                        {isActive ? "Active" : "Enable Server"}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 py-8 pb-16 flex flex-col items-center justify-center space-y-4">
                                <div className="rounded-full p-3 bg-primary/10">
                                    <ServerIcon className="h-7 w-7 text-primary" />
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="text-base font-medium">No MCP Servers Added</h3>
                                    <p className="text-sm text-muted-foreground max-w-[300px]">
                                        Add your first MCP server to access additional AI tools
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4">
                                    <a
                                        href="https://modelcontextprotocol.io"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-primary transition-colors"
                                    >
                                        Learn about MCP
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 overflow-y-auto px-1 py-0.5 mb-14 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <h3 className="text-sm font-medium">{editingServerId ? "Edit MCP Server" : "Add New MCP Server"}</h3>
                        <div className="space-y-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="name">
                                    Server Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newServer.name}
                                    onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                                    placeholder="My MCP Server"
                                    className="relative z-0"
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="transport-type">
                                    Transport Type
                                </Label>
                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">Choose how to connect to your MCP server:</p>
                                    <div className="grid gap-2 grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewServer({ ...newServer, type: 'sse' })}
                                            className={`flex items-center gap-2 p-3 rounded-md text-left border transition-all ${
                                                newServer.type === 'sse' 
                                                    ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                                                    : 'border-border hover:border-border/80 hover:bg-muted/50'
                                            }`}
                                        >
                                            <Globe className={`h-5 w-5 shrink-0 ${newServer.type === 'sse' ? 'text-primary' : ''}`} />
                                            <div>
                                                <p className="font-medium">SSE</p>
                                                <p className="text-xs text-muted-foreground">Server-Sent Events</p>
                                            </div>
                                        </button>
                                        
                                        <button
                                            type="button"
                                            onClick={() => setNewServer({ ...newServer, type: 'stdio' })}
                                            className={`flex items-center gap-2 p-3 rounded-md text-left border transition-all ${
                                                newServer.type === 'stdio' 
                                                    ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                                                    : 'border-border hover:border-border/80 hover:bg-muted/50'
                                            }`}
                                        >
                                            <Terminal className={`h-5 w-5 shrink-0 ${newServer.type === 'stdio' ? 'text-primary' : ''}`} />
                                            <div>
                                                <p className="font-medium">stdio</p>
                                                <p className="text-xs text-muted-foreground">Standard I/O</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {newServer.type === 'sse' ? (
                                <div className="grid gap-1.5">
                                    <Label htmlFor="url">
                                        Server URL
                                    </Label>
                                    <Input
                                        id="url"
                                        value={newServer.url}
                                        onChange={(e) => setNewServer({ ...newServer, url: e.target.value })}
                                        placeholder="https://mcp.example.com/token/sse"
                                        className="relative z-0"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Full URL to the SSE endpoint of the MCP server
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="command">
                                            Command
                                        </Label>
                                        <Input
                                            id="command"
                                            value={newServer.command}
                                            onChange={(e) => setNewServer({ ...newServer, command: e.target.value })}
                                            placeholder="node"
                                            className="relative z-0"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Executable to run (e.g., node, python)
                                        </p>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="args">
                                            Arguments
                                        </Label>
                                        <Input
                                            id="args"
                                            value={newServer.args?.join(' ') || ''}
                                            onChange={(e) => handleArgsChange(e.target.value)}
                                            placeholder="src/mcp-server.js --port 3001"
                                            className="relative z-0"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Space-separated arguments or JSON array
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Advanced Configuration */}
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="env-vars">
                                    <AccordionTrigger className="text-sm py-2">
                                        Environment Variables
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <Label htmlFor="env-key" className="text-xs mb-1 block">
                                                        Key
                                                    </Label>
                                                    <Input
                                                        id="env-key"
                                                        value={newEnvVar.key}
                                                        onChange={(e) => setNewEnvVar({ ...newEnvVar, key: e.target.value })}
                                                        placeholder="API_KEY"
                                                        className="h-8 relative z-0"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Label htmlFor="env-value" className="text-xs mb-1 block">
                                                        Value
                                                    </Label>
                                                    <Input
                                                        id="env-value"
                                                        value={newEnvVar.value}
                                                        onChange={(e) => setNewEnvVar({ ...newEnvVar, value: e.target.value })}
                                                        placeholder="your-secret-key"
                                                        className="h-8 relative z-0"
                                                        type="text"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addEnvVar}
                                                    disabled={!newEnvVar.key}
                                                    className="h-8 mt-1"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>

                                            {newServer.env && newServer.env.length > 0 ? (
                                                <div className="border rounded-md divide-y">
                                                    {newServer.env.map((env, index) => (
                                                        <div key={index} className="flex items-center justify-between p-2 text-sm">
                                                            <div className="flex-1 flex items-center gap-1 truncate">
                                                                <span className="font-mono text-xs">{env.key}</span>
                                                                <span className="mx-2 text-muted-foreground">=</span>
                                                                
                                                                {editingEnvIndex === index ? (
                                                                    <div className="flex gap-1 flex-1">
                                                                        <Input
                                                                            className="h-6 text-xs py-1 px-2"
                                                                            value={editedEnvValue}
                                                                            onChange={(e) => setEditedEnvValue(e.target.value)}
                                                                            onKeyDown={(e) => e.key === 'Enter' && saveEditedEnvValue()}
                                                                            autoFocus
                                                                        />
                                                                        <Button 
                                                                            size="sm" 
                                                                            className="h-6 px-2"
                                                                            onClick={saveEditedEnvValue}
                                                                        >
                                                                            Save
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-xs text-muted-foreground truncate">
                                                                            {isSensitiveKey(env.key) && !showSensitiveEnvValues[index] 
                                                                                ? maskValue(env.value) 
                                                                                : env.value}
                                                                        </span>
                                                                        <span className="flex ml-1 gap-1">
                                                                            {isSensitiveKey(env.key) && (
                                                                                <button
                                                                                    onClick={() => toggleSensitiveEnvValue(index)}
                                                                                    className="p-1 hover:bg-muted/50 rounded-full"
                                                                                >
                                                                                    {showSensitiveEnvValues[index] ? (
                                                                                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                                                                                    ) : (
                                                                                        <Eye className="h-3 w-3 text-muted-foreground" />
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => startEditEnvValue(index, env.value)}
                                                                                className="p-1 hover:bg-muted/50 rounded-full"
                                                                            >
                                                                                <Edit2 className="h-3 w-3 text-muted-foreground" />
                                                                            </button>
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeEnvVar(index)}
                                                                className="h-6 w-6 p-0 ml-2"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground text-center py-2">
                                                    No environment variables added
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Environment variables will be passed to the MCP server process.
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="headers">
                                    <AccordionTrigger className="text-sm py-2">
                                        {newServer.type === 'sse' ? 'HTTP Headers' : 'Additional Configuration'}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <Label htmlFor="header-key" className="text-xs mb-1 block">
                                                        Key
                                                    </Label>
                                                    <Input
                                                        id="header-key"
                                                        value={newHeader.key}
                                                        onChange={(e) => setNewHeader({ ...newHeader, key: e.target.value })}
                                                        placeholder="Authorization"
                                                        className="h-8 relative z-0"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Label htmlFor="header-value" className="text-xs mb-1 block">
                                                        Value
                                                    </Label>
                                                    <Input
                                                        id="header-value"
                                                        value={newHeader.value}
                                                        onChange={(e) => setNewHeader({ ...newHeader, value: e.target.value })}
                                                        placeholder="Bearer token123"
                                                        className="h-8 relative z-0"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addHeader}
                                                    disabled={!newHeader.key}
                                                    className="h-8 mt-1"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>

                                            {newServer.headers && newServer.headers.length > 0 ? (
                                                <div className="border rounded-md divide-y">
                                                    {newServer.headers.map((header, index) => (
                                                        <div key={index} className="flex items-center justify-between p-2 text-sm">
                                                            <div className="flex-1 flex items-center gap-1 truncate">
                                                                <span className="font-mono text-xs">{header.key}</span>
                                                                <span className="mx-2 text-muted-foreground">:</span>
                                                                
                                                                {editingHeaderIndex === index ? (
                                                                    <div className="flex gap-1 flex-1">
                                                                        <Input
                                                                            className="h-6 text-xs py-1 px-2"
                                                                            value={editedHeaderValue}
                                                                            onChange={(e) => setEditedHeaderValue(e.target.value)}
                                                                            onKeyDown={(e) => e.key === 'Enter' && saveEditedHeaderValue()}
                                                                            autoFocus
                                                                        />
                                                                        <Button 
                                                                            size="sm" 
                                                                            className="h-6 px-2"
                                                                            onClick={saveEditedHeaderValue}
                                                                        >
                                                                            Save
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-xs text-muted-foreground truncate">
                                                                            {isSensitiveKey(header.key) && !showSensitiveHeaderValues[index] 
                                                                                ? maskValue(header.value) 
                                                                                : header.value}
                                                                        </span>
                                                                        <span className="flex ml-1 gap-1">
                                                                            {isSensitiveKey(header.key) && (
                                                                                <button
                                                                                    onClick={() => toggleSensitiveHeaderValue(index)}
                                                                                    className="p-1 hover:bg-muted/50 rounded-full"
                                                                                >
                                                                                    {showSensitiveHeaderValues[index] ? (
                                                                                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                                                                                    ) : (
                                                                                        <Eye className="h-3 w-3 text-muted-foreground" />
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => startEditHeaderValue(index, header.value)}
                                                                                className="p-1 hover:bg-muted/50 rounded-full"
                                                                            >
                                                                                <Edit2 className="h-3 w-3 text-muted-foreground" />
                                                                            </button>
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeHeader(index)}
                                                                className="h-6 w-6 p-0 ml-2"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground text-center py-2">
                                                    No {newServer.type === 'sse' ? 'headers' : 'additional configuration'} added
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {newServer.type === 'sse'
                                                    ? 'HTTP headers will be sent with requests to the SSE endpoint.'
                                                    : 'Additional configuration parameters for the stdio transport.'}
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                )}

                {/* Persistent fixed footer with buttons */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border flex justify-between z-10">
                    {view === 'list' ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={clearAllServers}
                                size="sm"
                                className="gap-1.5 hover:text-black hover:dark:text-white"
                                disabled={selectedServers.length === 0}
                            >
                                <X className="h-3.5 w-3.5" />
                                Disable All
                            </Button>
                            <Button
                                onClick={() => setView('add')}
                                size="sm"
                                className="gap-1.5"
                            >
                                <PlusCircle className="h-3.5 w-3.5" />
                                Add Server
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleFormCancel}>
                                Cancel
                            </Button>
                            <Button
                                onClick={editingServerId ? updateServer : addServer}
                                disabled={
                                    !newServer.name ||
                                    (newServer.type === 'sse' && !newServer.url) ||
                                    (newServer.type === 'stdio' && (!newServer.command || !newServer.args?.length))
                                }
                            >
                                {editingServerId ? "Save Changes" : "Add Server"}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}; 
