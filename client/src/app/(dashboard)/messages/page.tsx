"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/provider/SocketProvider";
import { useUsers } from "@/hooks/useUsers";
import { useMessages } from "@/hooks/useMessage";
import { UserList } from "./components/userList";
import { MessageList } from "./components/MessageList";
import { ChatHeader } from "./components/ChatHeader";
import { ChatInput } from "./components/ChatInput";
import { Users } from "@/types";
import { useAuth } from "@/hooks/useAuth";

const ChatInterface: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<Users | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { socket } = useSocket();
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { users, isLoading: isUsersLoading } = useUsers(user?.userId as string);
  const { messages, sendMessage, coversationId } = useMessages(
    socket,
    selectedUser?.id as string
  );
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (content.trim() === "" || !selectedUser) return;
      sendMessage(selectedUser.id, content, coversationId);
    },
    [selectedUser, sendMessage, coversationId]
  );


  return (
    <div className="flex w-full h-[87vh] bg-gray-50">
      <div className="w-1/3 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
        </div>
        <div className="p-4">
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations"
              className="pl-10 bg-gray-50"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>
        <ScrollArea className="h-[70vh]">
          <UserList
            users={filteredUsers}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            isLoading={isUsersLoading}
          />
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            <ChatHeader user={selectedUser} />
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <MessageList
                messages={messages}
                currentUserId={user?.userId as string}
              />
            </ScrollArea>
            <ChatInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Welcome to Messages
              </h3>
              <p className="text-gray-500">
                Select a conversation to start chatting
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
