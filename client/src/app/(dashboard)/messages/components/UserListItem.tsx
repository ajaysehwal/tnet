import { Avatar,AvatarImage,AvatarFallback } from "@/components/ui/avatar";
import { Users } from "@/types";
import { motion } from "framer-motion";

export const UserListItem: React.FC<{
    user: Users;
    isActive: boolean;
    onClick: () => void;
  }> = ({ user, isActive, onClick }) => (
    <motion.div
      whileHover={{ backgroundColor: "#f3f4f6" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer rounded-lg transition-colors duration-200 ${
        isActive ? "bg-blue-50" : ""
      }`}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.name} alt={user.name} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        {user.status === "ONLINE" && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>
      <div className="ml-3 flex-grow">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{user.name}</span>
        </div>
        <p className="text-sm text-gray-600 truncate">{user.email}</p>
      </div>
      {/* {user.unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
        >
          {user.unreadCount}
        </motion.div>
      )} */}
    </motion.div>
  );