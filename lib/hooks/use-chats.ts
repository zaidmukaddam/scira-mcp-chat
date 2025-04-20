import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Chat } from '@/lib/db/schema';
import { toast } from 'sonner';

export function useChats(userId: string) {
  const queryClient = useQueryClient();
  
  // Main query to fetch chats
  const {
    data: chats = [],
    isLoading,
    error,
    refetch
  } = useQuery<Chat[]>({
    queryKey: ['chats', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const response = await fetch('/api/chats', {
        headers: {
          'x-user-id': userId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      
      return response.json();
    },
    enabled: !!userId, // Only run query if userId exists
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Mutation to delete a chat
  const deleteChat = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }
      
      return chatId;
    },
    onSuccess: (deletedChatId) => {
      // Update cache by removing the deleted chat
      queryClient.setQueryData<Chat[]>(['chats', userId], (oldChats = []) => 
        oldChats.filter(chat => chat.id !== deletedChatId)
      );
      
      toast.success('Chat deleted');
    },
    onError: (error) => {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  });

  // Function to invalidate chats cache for refresh
  const refreshChats = () => {
    queryClient.invalidateQueries({ queryKey: ['chats', userId] });
  };

  return {
    chats,
    isLoading,
    error,
    deleteChat: deleteChat.mutate,
    isDeleting: deleteChat.isPending,
    refreshChats,
    refetch
  };
} 