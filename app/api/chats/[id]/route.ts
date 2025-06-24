import { NextResponse } from "next/server";
import { getChatById, deleteChat } from "@/lib/chat-store";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  const { id } = params; // Extract id first
  console.log(`[DEBUG] GET /api/chats/${id} - Request received`);
  console.log(`[DEBUG] Headers:`, Object.fromEntries([...request.headers.entries()]));
  
  try {
    const userId = request.headers.get('x-user-id');
    console.log(`[DEBUG] User ID from header:`, userId);
    
    if (!userId) {
      console.log(`[DEBUG] Error: Missing user ID`);
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    console.log(`[DEBUG] Fetching chat ID:`, id);
    
    const chat = await getChatById(id, userId);
    console.log(`[DEBUG] Chat found:`, chat ? `ID: ${chat.id}, Title: ${chat.title}` : 'null');
    
    if (!chat) {
      console.log(`[DEBUG] Chat not found for ID: ${id}`);
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }
    
    console.log(`[DEBUG] Returning chat with ${chat.messages?.length || 0} messages`);
    return NextResponse.json(chat);
  } catch (error) {
    console.error(`[DEBUG] Error fetching chat:`, error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    const { id } = await params;
    await deleteChat(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}