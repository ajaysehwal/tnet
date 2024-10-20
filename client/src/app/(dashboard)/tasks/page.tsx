"use client";

import Dashboard from "@/components/dashboard";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Dashboard />;
  }

  return null;
}
