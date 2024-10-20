"use client";

import React, {
  createContext,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useState,
} from "react";
import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  connect: () => void;
  disconnect: () => void;
}

interface SocketProviderProps {
  children: React.ReactNode;
  url?: string;
}

interface SocketState {
  isConnected: boolean;
  connectionError: string | null;
}
const SOCKET_CONFIG: Partial<ManagerOptions & SocketOptions> = {
  transports: ["websocket", "polling"] as string[],
  withCredentials: true,
  extraHeaders: {
    "Content-Type": "application/json",
  },
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  randomizationFactor: 0,
};

const INITIAL_STATE: SocketState = {
  isConnected: false,
  connectionError: null,
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  url = process.env.NEXT_PUBLIC_SOCKER_SERVER as string,
}) => {
  const [state, setState] = useState<SocketState>(INITIAL_STATE);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const handleConnect = useCallback(() => {
    setState((prev) => ({ ...prev, isConnected: true, connectionError: null }));
    console.log("Socket connected successfully");
  }, []);

  const handleDisconnect = useCallback((reason: string) => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionError: `Disconnected: ${reason}`,
    }));
    console.log("Socket disconnected:", reason);
  }, []);

  const handleError = useCallback((error: Error) => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionError: error.message,
    }));
    console.error("Socket error:", error);
  }, []);

  const createSocketConnection = useCallback(
    (currentUser: User) => {
      try {
        if (socketRef.current?.connected) {
          console.log("Socket is already connected");
          return;
        }

        const socketOptions: Partial<ManagerOptions & SocketOptions> = {
          ...SOCKET_CONFIG,
          query: {
            userId: currentUser.userId,
          },
        };

        const socket = io(url, socketOptions);

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleError);
        socket.on("error", handleError);

        socketRef.current = socket;
      } catch (error) {
        console.error("Failed to create socket connection:", error);
        setState((prev) => ({
          ...prev,
          connectionError:
            error instanceof Error
              ? error.message
              : "Failed to create socket connection",
        }));
      }
    },
    [url, handleConnect, handleDisconnect, handleError]
  );

  const connect = useCallback(() => {
    if (!user) {
      setState((prev) => ({ ...prev, connectionError: "No user available" }));
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    createSocketConnection(user);
  }, [user, createSocketConnection]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setState(INITIAL_STATE);
  }, []);

  const handleReconnection = useCallback(() => {
    if (!state.isConnected && user) {
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Attempting to reconnect...");
        connect();
      }, 5000);
    }
  }, [state.isConnected, user, connect]);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  useEffect(() => {
    handleReconnection();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [handleReconnection]);

  const contextValue: SocketContextType = {
    socket: socketRef.current,
    isConnected: state.isConnected,
    connectionError: state.connectionError,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
