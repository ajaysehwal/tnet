import React from "react";
import {  AnimatePresence } from "framer-motion";
import {  Users } from "@/types";
import { UserListItem } from "./UserListItem";
import { LoadingSkeleton } from "./LoadingSkeleton";

interface UserListProps {
  users: Users[];
  selectedUser: Users | null;
  onSelectUser: (user: Users) => void;
  isLoading: boolean;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  selectedUser,
  onSelectUser,
  isLoading,
}) => (
  <AnimatePresence>
    {isLoading
      ? Array(5)
          .fill(0)
          .map((_, i) => <LoadingSkeleton key={i} />)
      : users.map((user) => (
          <UserListItem
            key={user.id}
            user={user}
            isActive={selectedUser?.id === user.id}
            onClick={() => onSelectUser(user)}
          />
        ))}
  </AnimatePresence>
);