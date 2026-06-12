import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";

export default function Index() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      if (role === "admin") {
        router.replace("/(tabs)");
      } else if (role === "super-admin") {
        router.replace("/(super-admin)");
      }
    } else {
      router.replace("/(auth)/admin/login");
    }
  }, [isAuthenticated, role]);

  return null;
}