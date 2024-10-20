import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slices";
import taskReducers from "./slices/task.slices";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks:taskReducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;