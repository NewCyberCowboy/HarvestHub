import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authService } from '@/services/auth';
import type { AuthUserDto, LoginDto, RegisterDto } from '@/types/backend';

interface AuthContextValue {
  user: AuthUserDto | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginDto) => Promise<void>;
  register: (payload: RegisterDto) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_STORAGE_KEY = 'harvesthub-mobile-auth';

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw) as { user: AuthUserDto; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    };

    void restoreSession();
  }, []);

  const login = async (payload: LoginDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(payload);
      setUser(response.user);
      setToken(response.token);
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: response.user, token: response.token })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка входа';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(payload);
      setUser(response.user);
      setToken(response.token);
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: response.user, token: response.token })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка регистрации';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    void AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ user, token, isLoading, error, login, register, logout }),
    [user, token, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
}
