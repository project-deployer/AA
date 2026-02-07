import React, { createContext, useContext, useState, useCallback } from "react";

const STORAGE_KEY = "agriai_auth";

interface AuthState {
  token: string | null;
  farmerId: number | null;
  farmerName: string | null;
  profileImage: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  setAuth: (token: string, farmerId: number, farmerName?: string, profileImage?: string) => void;
  updateProfile: (farmerName: string, profileImage?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s) as AuthState;
        if (parsed.token && parsed.farmerId) return parsed;
      }
    } catch {}
    return { token: null, farmerId: null, farmerName: null, profileImage: null };
  });

  const setAuth = useCallback((token: string, farmerId: number, farmerName?: string, profileImage?: string) => {
    const next = { token, farmerId, farmerName: farmerName || null, profileImage: profileImage || null };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateProfile = useCallback((farmerName: string, profileImage?: string) => {
    setState((prev) => {
      const next = { ...prev, farmerName: farmerName || prev.farmerName, profileImage: profileImage || prev.profileImage };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, farmerId: null, farmerName: null, profileImage: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: AuthContextValue = {
    ...state,
    isAuthenticated: !!state.token && !!state.farmerId,
    setAuth,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
