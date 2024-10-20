"use client";
import { useAuth } from "@/hooks/useAuth";
import { redirect } from "next/navigation";

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return redirect('/tasks');
  }

  return null;
}
