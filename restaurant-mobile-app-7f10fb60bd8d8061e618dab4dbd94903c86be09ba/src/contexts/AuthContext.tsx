import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_URL } from '@/constants/config';

type UserRole = 'admin' | 'super-admin' | null;

type AuthContextType = {
  role: UserRole;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>(null);
  const isAuthenticated = !!role;

  // Clear stored role and token on mount so reloading forces re-login
  useEffect(() => {
    const clearSession = async () => {
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('userToken');
      setRole(null);
    };
    clearSession();
  }, []);

  const signIn = async (email: string, password: string, chosenRole: UserRole) => {
    if (!email || !password || !chosenRole) {
      throw new Error('Please enter email and password.');
    }

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Authentication failed');
    }

    const { token, user } = await res.json();

    if (user.role !== chosenRole) {
      throw new Error(`This account does not have access as ${chosenRole}.`);
    }

    // Store role and token securely
    await AsyncStorage.setItem('userRole', user.role);
    await AsyncStorage.setItem('userToken', token);
    setRole(user.role);

    // Redirect based on role
    if (user.role === 'admin') {
      router.replace('/(tabs)');
    } else if (user.role === 'super-admin') {
      router.replace('/(super-admin)');
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userToken');
    setRole(null);
    router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ role, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
