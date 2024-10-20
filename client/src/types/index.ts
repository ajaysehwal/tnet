export interface User {
    userId: string;
    email: string;
    role: string;
    name: string;
    status?: string;
  }
  export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  }
  export type TaskStatus = "PENDING" | "COMPLETED" | "IN_PROGRESS";
  export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    dueDate: string;
    assignedTo: string;
    description?: string;
  }
  
  export enum Role {
    ADMIN,
    USER,
  }
  export interface Users {
    id: string;
    name: string;
    email: string;
    status: "ONLINE" | "OFFLINE";
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  }
  export interface Message {
    content: string;
    conversationId: string;
    createdAt: string;
    id: string;
    receiverId: string;
    senderId: string;
    updatedAt: string;
  }