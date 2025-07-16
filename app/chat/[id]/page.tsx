"use client";

import Chat from "@/components/chat";
import { ChatSidebar } from "@/components/chat-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { getUserId } from "@/lib/user-id";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
  const params = useParams();
  const chatId = params?.id as string;
  const queryClient = useQueryClient();
  const userId = getUserId();

  // Prefetch chat data
  useEffect(() => {
    async function prefetchChat() {
      if (!chatId || !userId) return;
      
      // Check if data already exists in cache
      const existingData = queryClient.getQueryData(['chat', chatId, userId]);
      if (existingData) return;

      // Prefetch the data
      await queryClient.prefetchQuery({
        queryKey: ['chat', chatId, userId] as const,
        queryFn: async () => {
          const response = await fetch(`/api/chats/${chatId}`, {
            headers: {
              'x-user-id': userId
            }
          });
          
          if (!response.ok) {
            // For 404, return empty chat data instead of throwing
            if (response.status === 404) {
              return { id: chatId, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            }
            throw new Error('Failed to load chat');
          }
          
          return response.json();
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    }

    prefetchChat();
  }, [chatId, userId, queryClient]);

  return (
    <div className="flex h-dvh w-full">
      <ChatSidebar />
      <main className="flex-1 flex flex-col relative">
        <div className="absolute top-4 left-4 z-50">
          <SidebarTrigger>
            <button className="flex items-center justify-center h-8 w-8 bg-muted hover:bg-accent rounded-md transition-colors">
              <Menu className="h-4 w-4" />
            </button>
          </SidebarTrigger>
        </div>
        <div className="flex-1 flex justify-center">
          <Chat />
        </div>
      </main>
    </div>
  );
} 