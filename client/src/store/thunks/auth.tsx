import { createAsyncThunk } from "@reduxjs/toolkit";
import { account, databases } from "@/config/appwrite";
import { User } from "@/types";
import { Query,ID } from "appwrite";

const DATABASE_ID = "670fd308001680e7b99c";
const COLLECTION_ID = "670fd318000f32a7d61e";

export const register = createAsyncThunk<
  User,
  { email: string; password: string; role: string; name: string }
>("auth/register", async ({ email, password, role, name }) => {
  try {
    const userId = ID.unique();
    await account.create(userId, email, password, name);
    await account.createEmailPasswordSession(email,password)
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      userId,
      { role }
    );
    return { userId, email, role, name };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
});

export const login = createAsyncThunk<
  User,
  { email: string; password: string }
>("auth/login", async ({ email, password }) => {
  try {
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    const documents = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal("$id", user.$id)]
    );
    
    if (documents.documents.length === 0) {
      throw new Error("User role not found");
    }
    
    const role = documents.documents[0].role;
    return {
      userId: user.$id,
      email: user.email,
      role,
      name: user.name,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await account.deleteSession("current");
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
});


export const checkAuth = createAsyncThunk<User>("auth/checkAuth", async () => {
  try {
    const user = await account.get();
    const documents = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal("$id", user.$id)]
    );
    
    if (documents.documents.length === 0) {
      throw new Error("User role not found");
    }
    
    const role = documents.documents[0].role;
    return {
      userId: user.$id,
      email: user.email,
      role,
      name: user.name,
    };
  } catch (error) {
    console.error("Auth check error:", error);
    throw error;
  }
});