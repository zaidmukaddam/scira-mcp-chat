import Chat from "@/components/chat";
import { ChatSidebar } from "@/components/chat-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

export default function Page() {
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
