import type { Message as TMessage } from "ai";
import { Message } from "./message";
import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom";

export const Messages = ({
  messages,
  isLoading,
  status,
}: {
  messages: TMessage[];
  isLoading: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
}) => {
  // const [containerRef, endRef] = useScrollToBottom();
  return (
    <div
      className="h-full overflow-y-auto"
      // ref={containerRef}
    >
      <div className="max-w-xl mx-auto py-4">
        {messages.map((m, i) => (
          <Message
            key={i}
            isLatestMessage={i === messages.length - 1}
            isLoading={isLoading}
            message={m}
            status={status}
          />
        ))}
        {/* <div className="h-1" ref={endRef} /> */}
      </div>
    </div>
  );
};
