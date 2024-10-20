import { useState, useEffect, useCallback } from "react";
import { Message } from "@/types";
import { Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

export const useMessages = (
  socket: Socket | null,
  recipientId: string | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();
  const [coversationId, setConversationId] = useState<string>("");
  const addMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  const sendMessage = useCallback(
    (recipientId: string, content: string, conversationId: string) => {
      if (!socket) return;
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: user?.userId as string,
        receiverId: recipientId,
        content,
        conversationId,
        createdAt: new Date().toString(),
        updatedAt: new Date().toString(),
      };
      socket.emit("sendMessage", { recipientId, content, conversationId });
      addMessage(newMessage);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [socket, addMessage]
  );
  useEffect(() => {
    if (!socket) return;
    socket.emit("getConversation", recipientId);
    socket.on("conversation", (conversation) => {
      setConversationId(conversation.id);
      setMessages(conversation.messages);
    });
    return () => {
      socket.off("conversation");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientId]);

  useEffect(() => {
    if (!socket) return;
    socket.on("messageReceived", (message: Message) => {
      addMessage(message);
    });
    return () => {
      socket.off("messageReceived");
    };
  }, [socket,addMessage]);

  return {
    messages,
    sendMessage,
    coversationId,
  };
};
