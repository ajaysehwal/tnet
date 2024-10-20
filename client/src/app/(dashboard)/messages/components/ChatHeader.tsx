import React from "react";
import { Phone, Video, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "@/types";

interface ChatHeaderProps {
  user: Users;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ user }) => (
  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm">
    <div className="flex items-center">
      <Avatar className="h-10 w-10 mr-3">
        <AvatarImage src={user.name} alt={user.name} />
        <AvatarFallback>{user.name[0]}</AvatarFallback>
      </Avatar>
      <div>
        <h2 className="text-xl font-semibold">{user.name}</h2>
        <span className="text-sm text-gray-500">
          {user.status === "ONLINE" ? "Active now" : "Offline"}
        </span>
      </div>
    </div>
    <div className="flex space-x-2">
      <Button variant="ghost" size="icon">
        <Phone size={20} />
      </Button>
      <Button variant="ghost" size="icon">
        <Video size={20} />
      </Button>
      <Button variant="ghost" size="icon">
        <Info size={20} />
      </Button>
    </div>
  </div>
);