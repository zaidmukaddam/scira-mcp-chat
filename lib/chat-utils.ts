import { type Message, type MessagePart } from "./db/schema";

type UIMessage = {
  id: string;
  role: string;
  content: string;
  parts: MessagePart[];
  createdAt?: Date;
};

export function convertToUIMessages(dbMessages: Array<Message>): Array<UIMessage> {
  return dbMessages.map(msg => {
    // Extract text content from parts
    const textContent = getTextContent(msg);
    
    return {
      id: msg.id,
      role: msg.role,
      content: textContent,
      parts: msg.parts as MessagePart[],
      createdAt: msg.createdAt
    };
  });
}

export function getTextContent(message: Message): string {
  if (!message.parts || !Array.isArray(message.parts)) {
    return '';
  }

  return message.parts
    .filter(part => part.type === 'text' && part.text)
    .map(part => part.text)
    .join('');
}
