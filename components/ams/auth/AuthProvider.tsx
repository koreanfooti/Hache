"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AmsAuthRole } from "@/lib/ams/auth-rules";
import {
  authRoleCookieName,
  authSessionStorageKey,
  authUsersStorageKey,
  demoAuthUsers,
  type RealAmsAuthUser,
  normalizeAuthEmail,
  type StoredRealAmsAuthUser,
} from "@/lib/ams/auth-session";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type SignUpInput = {
  name: string;
  email: string;
  password: string;
  role: AmsAuthRole;
};

type AuthContextValue = {
  status: AuthStatus;
  user: RealAmsAuthUser | null;
  signIn: (email: string, password: string) => Promise<RealAmsAuthUser>;
  signUp: (input: SignUpInput) => Promise<RealAmsAuthUser>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<RealAmsAuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      seedDemoUsers();
      const session = readSession();
      if (cancelled) return;
      setUser(session);
      setStatus(session ? "authenticated" : "unauthenticated");
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    async signIn(email, password) {
      const normalizedEmail = normalizeAuthEmail(email);
      const users = readUsers();
      const matchedUser = users.find((item) => item.email === normalizedEmail && item.password === password);

      if (!matchedUser) {
        throw new Error("Invalid email or password.");
      }

      const nextUser = publicUser(matchedUser);
      writeSession(nextUser);
      setUser(nextUser);
      setStatus("authenticated");
      return nextUser;
    },
    async signUp(input) {
      const normalizedEmail = normalizeAuthEmail(input.email);
      const trimmedName = input.name.trim();

      if (!trimmedName) throw new Error("Enter a name.");
      if (!normalizedEmail.includes("@")) throw new Error("Enter a valid email address.");
      if (input.password.length < 8) throw new Error("Use at least 8 characters for the password.");

      const users = readUsers();
      if (users.some((item) => item.email === normalizedEmail)) {
        throw new Error("An account already exists for that email.");
      }

      const nextStoredUser: StoredRealAmsAuthUser = {
        id: `user-${Date.now()}`,
        name: trimmedName,
        email: normalizedEmail,
        role: input.role,
        password: input.password,
      };
      const nextUser = publicUser(nextStoredUser);

      writeUsers([...users, nextStoredUser]);
      writeSession(nextUser);
      setUser(nextUser);
      setStatus("authenticated");
      return nextUser;
    },
    signOut() {
      window.localStorage.removeItem(authSessionStorageKey);
      expireRoleCookie();
      setUser(null);
      setStatus("unauthenticated");
    },
  }), [status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}

function seedDemoUsers() {
  const existingUsers = readUsers();
  if (existingUsers.length) return;
  writeUsers(demoAuthUsers);
}

function readUsers(): StoredRealAmsAuthUser[] {
  if (typeof window === "undefined") return demoAuthUsers;

  try {
    const stored = JSON.parse(window.localStorage.getItem(authUsersStorageKey) || "[]");
    return Array.isArray(stored) ? stored : demoAuthUsers;
  } catch {
    return demoAuthUsers;
  }
}

function writeUsers(users: StoredRealAmsAuthUser[]) {
  window.localStorage.setItem(authUsersStorageKey, JSON.stringify(users));
}

function readSession(): RealAmsAuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const session = JSON.parse(window.localStorage.getItem(authSessionStorageKey) || "null") as RealAmsAuthUser | null;
    if (!session?.email || !session.role) return null;
    writeRoleCookie(session.role);
    return session;
  } catch {
    return null;
  }
}

function writeSession(user: RealAmsAuthUser) {
  window.localStorage.setItem(authSessionStorageKey, JSON.stringify(user));
  writeRoleCookie(user.role);
}

function publicUser(user: StoredRealAmsAuthUser): RealAmsAuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function writeRoleCookie(role: AmsAuthRole) {
  document.cookie = `${authRoleCookieName}=${role}; Path=/; Max-Age=604800; SameSite=Lax`;
}

function expireRoleCookie() {
  document.cookie = `${authRoleCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
}
