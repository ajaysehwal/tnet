import React, { useState } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [inputMessage, setInputMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() !== "") {
      onSendMessage(inputMessage);
      setInputMessage("");
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow bg-gray-50"
        />
        <Button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 transition-colors"
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};