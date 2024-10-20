import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Message } from "@/types";
import { formatMessageTime } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  isLastInGroup?: boolean;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser,
  isLastInGroup = true,
  onEdit,
  onDelete
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const messageVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 1,
        velocity: 2
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    }
  };

  return (
    <motion.div
      layout
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={messageVariants}
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} 
        ${isLastInGroup ? "mb-3" : "mb-0.5"}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} relative group`}>
        {isCurrentUser && (
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={menuVariants}
                className="absolute -top-2 right-0 z-10"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <MoreVertical size={16} className="text-gray-600 dark:text-gray-300" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem 
                      onClick={() => onEdit?.(message.id)}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Edit2 size={14} />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(message.id)}
                      className="flex items-center gap-2 text-sm text-red-600 focus:text-red-600"
                    >
                      <Trash2 size={14} />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <motion.div
          layout
          className={`
            relative px-4 py-2 rounded-2xl shadow-sm
            transform transition-all duration-200
            hover:shadow-md
            ${isCurrentUser 
              ? "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white mr-2" 
              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 ml-2"
            }
            ${!isLastInGroup && isCurrentUser ? "rounded-br-md" : ""}
            ${!isLastInGroup && !isCurrentUser ? "rounded-bl-md" : ""}
            max-w-[280px] md:max-w-[420px]
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>

          <div className={`
            flex items-center gap-1 mt-1
            ${isCurrentUser ? "justify-end" : "justify-start"}
          `}>
            <span className={`
              text-xs
              ${isCurrentUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}
            `}>
              {formatMessageTime(message.createdAt)}
            </span>

            {isCurrentUser && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Check size={14} className="text-blue-100" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;