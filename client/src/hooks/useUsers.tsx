import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Users } from "@/types";

export const useUsers = (authToken: string) => {
  const [users, setUsers] = useState<Users[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
   console.log(authToken);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SOCKER_SERVER}/users`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },

        withCredentials: true,
      });

      setUsers(response.data.users);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error fetching users";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (!authToken) {
      setError("Authentication token is missing");
      setIsLoading(false);
      return;
    }

    fetchUsers();
  }, [authToken, fetchUsers]);

  return {
    users,
    isLoading,
    error,
    refetchUsers: fetchUsers,
  };
};
