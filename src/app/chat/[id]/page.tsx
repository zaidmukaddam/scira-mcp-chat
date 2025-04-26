"use client";

import Chat from "@/components/chat";
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
          try {
            const response = await fetch(`/api/chats/${chatId}`, {
              headers: {
                'x-user-id': userId
              }
            });
            
            if (!response.ok) {
              // If chat doesn't exist yet (404), return null instead of throwing
              // This is expected for new chats that haven't been saved yet
              if (response.status === 404) {
                console.log('Chat not found yet, may be a new chat');
                return null;
              }
              
              // For other errors, log but don't throw to prevent React Query from retrying
              console.error(`Failed to load chat: ${response.status}`);
              return null;
            }
            
            return response.json();
          } catch (error) {
            console.error('Error prefetching chat:', error);
            return null;
          }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    }

    prefetchChat();
  }, [chatId, userId, queryClient]);

  return <Chat />;
} 