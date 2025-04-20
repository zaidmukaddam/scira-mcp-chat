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
              throw new Error('Failed to load chat');
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