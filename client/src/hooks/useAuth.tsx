"use client";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { login, logout, register, checkAuth } from "@/store/thunks/auth";
import { clearError } from "@/store/slices/auth.slices";

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth
  );
  return {
    user,
    dispatch,
    isAuthenticated,
    loading,
    error,
    login: (email: string, password: string) =>
      dispatch(login({ email, password })),
    logout: () => dispatch(logout()),
    register: (email: string, password: string, role: string, name: string) =>
      dispatch(register({ email, password, role, name })),
    checkAuth: () => dispatch(checkAuth()),
    clearError: () => dispatch(clearError()),
  };
};