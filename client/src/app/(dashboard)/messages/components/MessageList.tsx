import React from "react";
import { AnimatePresence } from "framer-motion";
import { Message } from "@/types";
import ChatMessage  from "./ChatMessage";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
}) => (
  <AnimatePresence>
    {messages.map((message) => (
      <ChatMessage
        key={message.id}
        message={message}
        isCurrentUser={message.senderId === currentUserId}
      />
    ))}
  </AnimatePresence>
);