import { NextResponse } from "next/server";
import { getChats } from "@/lib/chat-store";

export async function GET(request: Request) {
  try {    
    const userId = request.headers.get('x-user-id');
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    const chats = await getChats(userId, projectId);
    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}