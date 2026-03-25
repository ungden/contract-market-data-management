"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase";

type Role = "super_admin" | "sale_admin" | "market_staff" | "manager";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // DEMO MODE: Default to a mock super_admin profile so you can test without logging in
  const [profile, setProfile] = useState<UserProfile | null>({
    uid: "demo-admin-123",
    email: "demo@titanlabs.vn",
    displayName: "Demo Admin",
    role: "super_admin"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // DEMO MODE: Bypass actual Firebase Auth listener
    /*
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // ... original logic
    });
    return () => unsubscribe();
    */
  }, []);

  const login = async () => {
    // Demo mode login
    setProfile({
      uid: "demo-admin-123",
      email: "demo@titanlabs.vn",
      displayName: "Demo Admin",
      role: "super_admin"
    });
    window.location.href = "/";
  };

  const logout = async () => {
    // Demo mode logout
    setProfile(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
