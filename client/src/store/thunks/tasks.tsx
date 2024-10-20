import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { Task } from "@/types";
import { account } from "@/config/appwrite";
// Constants
const API_BASE_URL = process.env.NEXT_PUBLIC_CRUD_SERVER as string;
const API_TIMEOUT = 5000;

const appWriteAuth = async () => {
  const user = await account.get();
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.$id;
};
// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.request.use(
  async (config) => {
    try {
      const userId = await appWriteAuth();
      config.headers.Authorization = `Bearer ${userId}`;
    } catch (error) {
      console.error("Failed to get Firebase token:", error);
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);
export default api;

const handleError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "An error occurred";
  }
  return "An unknown error occurred";
};
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Task[]>("/tasks");
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

type CreateTaskPayload = Omit<Task, "id">;

export const addTask = createAsyncThunk(
  "tasks/addTask",
  async (task: CreateTaskPayload, { rejectWithValue }) => {
    try {
      const response = await api.post<Task>("/tasks", task);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async (task: Task, { rejectWithValue }) => {
    try {
      const response = await api.put<Task>(`/tasks/${task.id}`, task);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/tasks/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);
