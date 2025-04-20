"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, PlusCircle, Trash2, ServerIcon, Settings, Loader2, Sparkles } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuBadge,
    SidebarSeparator,
    useSidebar
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { type Chat } from "@/lib/db/schema";
import Image from "next/image";
import { MCPServerManager, type MCPServer } from "./mcp-server-manager";
import { ThemeToggle } from "./theme-toggle";
import { useTheme } from "next-themes";
import { getUserId } from "@/lib/user-id";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { useChats } from "@/lib/hooks/use-chats";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function ChatSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [userId, setUserId] = useState<string>('');
    const [mcpServers, setMcpServers] = useLocalStorage<MCPServer[]>(STORAGE_KEYS.MCP_SERVERS, []);
    const [selectedMcpServers, setSelectedMcpServers] = useLocalStorage<string[]>(STORAGE_KEYS.SELECTED_MCP_SERVERS, []);
    const [mcpSettingsOpen, setMcpSettingsOpen] = useState(false);
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    // Initialize userId
    useEffect(() => {
        setUserId(getUserId());
    }, []);
    
    // Use TanStack Query to fetch chats
    const { chats, isLoading, deleteChat, refreshChats } = useChats(userId);

    // Start a new chat
    const handleNewChat = () => {
        router.push('/');
    };

    // Delete a chat
    const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        deleteChat(chatId);
        
        // If we're currently on the deleted chat's page, navigate to home
        if (pathname === `/chat/${chatId}`) {
            router.push('/');
        }
    };

    // Get active MCP servers status
    const activeServersCount = selectedMcpServers.length;
    const multipleServersActive = activeServersCount > 1;

    // Show loading state if user ID is not yet initialized
    if (!userId) {
        return null; // Or a loading spinner
    }

    return (
        <Sidebar className="shadow-sm bg-background/80 dark:bg-background/40 backdrop-blur-md" collapsible="icon">
            <SidebarHeader className="p-4 border-b border-border/40">
                <div className="flex items-center justify-start">
                    <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center w-full" : ""}`}>
                        <div className={`relative rounded-full bg-primary/10 flex items-center justify-center ${isCollapsed ? "size-5 p-3" : "size-6"}`}>
                            <Image src="/scira.png" alt="Scira Logo" width={24} height={24} className="invert dark:invert-0 absolute transform scale-75" unoptimized quality={100} />
                        </div>
                        {!isCollapsed && (
                            <div className="font-semibold text-lg text-foreground/90">MCP</div>
                        )}
                    </div>
                </div>
            </SidebarHeader>
            
            <SidebarContent className="pt-4">
                <SidebarGroup>
                    <SidebarGroupLabel className={cn(
                        "px-4 mb-1 text-xs font-medium text-muted-foreground/80 uppercase tracking-wider",
                        isCollapsed ? "sr-only" : ""
                    )}>
                        Chats
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {isLoading ? (
                                <div className={`flex items-center justify-center py-4 ${isCollapsed ? "" : "px-4"}`}>
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    {!isCollapsed && (
                                        <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
                                    )}
                                </div>
                            ) : chats.length === 0 ? (
                                <div className={`flex flex-col items-center gap-2 py-6 ${isCollapsed ? "" : "px-4"}`}>
                                    {isCollapsed ? (
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/60">
                                            <Sparkles className="h-3 w-3 text-secondary-foreground" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center py-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60 mb-3">
                                                <Sparkles className="h-5 w-5 text-secondary-foreground" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground/90">No chats yet</span>
                                            <span className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                                Start a new conversation below
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                chats.map((chat) => (
                                    <SidebarMenuItem key={chat.id}>
                                        <SidebarMenuButton 
                                            asChild
                                            tooltip={isCollapsed ? chat.title : undefined}
                                            data-active={pathname === `/chat/${chat.id}`}
                                            className={cn(
                                                "transition-all hover:bg-secondary/50 active:bg-secondary/70",
                                                pathname === `/chat/${chat.id}` ? "bg-secondary/60 hover:bg-secondary/60" : ""
                                            )}
                                        >
                                            <Link
                                                href={`/chat/${chat.id}`}
                                                className="flex items-center justify-between w-full gap-1"
                                            >
                                                <div className="flex items-center min-w-0 overflow-hidden flex-1 pr-2">
                                                    <MessageSquare className={cn(
                                                        "h-4 w-4 flex-shrink-0",
                                                        pathname === `/chat/${chat.id}` ? "text-foreground" : "text-muted-foreground"
                                                    )} />
                                                    {!isCollapsed && (
                                                        <span className={cn(
                                                            "ml-2 truncate text-sm",
                                                            pathname === `/chat/${chat.id}` ? "text-foreground font-medium" : "text-foreground/80"
                                                        )} title={chat.title}>
                                                            {chat.title.length > 18 ? `${chat.title.slice(0, 18)}...` : chat.title}
                                                        </span>
                                                    )}
                                                </div>
                                                {!isCollapsed && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-foreground flex-shrink-0"
                                                        onClick={(e) => handleDeleteChat(chat.id, e)}
                                                        title="Delete chat"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                
                <div className="relative my-3">
                    <div className="absolute inset-x-0">
                        <Separator className="w-full h-px bg-border/40" />
                    </div>
                </div>
                
                <SidebarGroup>
                    <SidebarGroupLabel className={cn(
                        "px-4 mb-1 text-xs font-medium text-muted-foreground/80 uppercase tracking-wider",
                        isCollapsed ? "sr-only" : ""
                    )}>
                        MCP Servers
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton 
                                    onClick={() => setMcpSettingsOpen(true)}
                                    className={cn(
                                        "w-full flex items-center gap-2 transition-all",
                                        "hover:bg-secondary/50 active:bg-secondary/70"
                                    )}
                                    tooltip={isCollapsed ? "MCP Servers" : undefined}
                                >
                                    <ServerIcon className={cn(
                                        "h-4 w-4 flex-shrink-0",
                                        activeServersCount > 0 ? "text-green-500" : "text-muted-foreground"
                                    )} />
                                    {!isCollapsed && (
                                        <span className="flex-grow text-sm text-foreground/80">MCP Servers</span>
                                    )}
                                    {activeServersCount > 0 && !isCollapsed ? (
                                        <Badge 
                                            variant="secondary" 
                                            className="ml-auto text-[10px] px-1.5 py-0 h-5 bg-secondary/80"
                                        >
                                            {activeServersCount}
                                        </Badge>
                                    ) : activeServersCount > 0 && isCollapsed ? (
                                        <SidebarMenuBadge className="bg-secondary/80 text-secondary-foreground">
                                            {activeServersCount}
                                        </SidebarMenuBadge>
                                    ) : null}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            
            <SidebarFooter className="p-4 border-t border-border/40 mt-auto">
                <div className={`flex flex-col ${isCollapsed ? "items-center" : ""} gap-3`}>
                    <Button
                        variant="default"
                        className={cn(
                            "w-full bg-primary text-primary-foreground hover:bg-primary/90",
                            isCollapsed ? "w-8 h-8 p-0" : ""
                        )}
                        onClick={handleNewChat}
                        title={isCollapsed ? "New Chat" : undefined}
                    >
                        <PlusCircle className={`${isCollapsed ? "" : "mr-2"} h-4 w-4`} />
                        {!isCollapsed && <span>New Chat</span>}
                    </Button>
                    
                    <div className={`flex ${isCollapsed ? "flex-col" : ""} gap-2 ${isCollapsed ? "items-center" : "justify-between items-center"}`}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                            onClick={() => setMcpSettingsOpen(true)}
                        >
                            <Settings className="h-4 w-4" />
                            <span className="sr-only">MCP Settings</span>
                        </Button>
                        <ThemeToggle className="hover:bg-secondary/50 text-muted-foreground hover:text-foreground" />
                    </div>
                </div>
                
                <MCPServerManager
                    servers={mcpServers}
                    onServersChange={setMcpServers}
                    selectedServers={selectedMcpServers}
                    onSelectedServersChange={setSelectedMcpServers}
                    open={mcpSettingsOpen}
                    onOpenChange={setMcpSettingsOpen}
                />
            </SidebarFooter>
        </Sidebar>
    );
} 