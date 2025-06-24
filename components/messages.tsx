import type { Message as TMessage } from "ai";
import { Message } from "./message";
import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom";

export const Messages = ({
  messages,
  isLoading,
  status,
  append,
}: {
  messages: TMessage[];
  isLoading: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
  append: (
    message: TMessage | any,
    chatRequestOptions?: any
  ) => Promise<any>;
}) => {
  const [containerRef, endRef] = useScrollToBottom();
  
  return (
    <div
      className="h-full overflow-y-auto no-scrollbar"
      ref={containerRef}
    >
      <div className="max-w-lg sm:max-w-3xl mx-auto py-4">
        {messages.map((m, i) => (
          <Message
            key={i}
            isLatestMessage={i === messages.length - 1}
            isLoading={isLoading}
            message={m}
            status={status}
            append={append}
          />
        ))}
        <div className="h-1" ref={endRef} />
      </div>
    </div>
  );
};
