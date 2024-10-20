"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { checkAuth, loading, isAuthenticated } = useAuth();
  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthStatus = async () => {
    try {
      await checkAuth();
    } catch (error: unknown) {
      console.log(error);
    }
  };
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);

      if (!isAuthenticated) {
        router.push("/login");
      } else {
        router.push("/");
      }
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !authChecked) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};
