import { createContext, useContext, useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";

export interface AuthUser {
  id: bigint;
  name: string;
  role: string;
  pin: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  canEdit: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: () => {},
  logout: () => {},
  canEdit: false,
  isAdmin: false,
});

function serializeUser(user: AuthUser): string {
  return JSON.stringify({ ...user, id: user.id.toString() });
}

function deserializeUser(raw: string): AuthUser | null {
  try {
    const obj = JSON.parse(raw);
    return { ...obj, id: BigInt(obj.id) };
  } catch {
    return null;
  }
}

// Safe heartbeat call - only calls if the method exists on the actor
function safeHeartbeat(actor: unknown, userId: bigint) {
  try {
    const fn = (actor as Record<string, unknown>).sendHeartbeat;
    if (typeof fn === "function") {
      (fn as (id: bigint) => Promise<void>).call(actor, userId).catch(() => {});
    }
  } catch {
    // ignore
  }
}

// Inner component that has access to useActor
function HeartbeatSender({ userId }: { userId: bigint }) {
  const { actor } = useActor();

  useEffect(() => {
    if (!actor) return;
    // Send immediately on login
    safeHeartbeat(actor, userId);
    // Then every 60 seconds
    const interval = setInterval(() => {
      safeHeartbeat(actor, userId);
    }, 60_000);
    return () => clearInterval(interval);
  }, [actor, userId]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("gaushala_user");
    if (!raw) return null;
    return deserializeUser(raw);
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("gaushala_user", serializeUser(currentUser));
    } else {
      localStorage.removeItem("gaushala_user");
    }
  }, [currentUser]);

  function login(user: AuthUser) {
    setCurrentUser(user);
  }

  function logout() {
    setCurrentUser(null);
  }

  const roleLower = currentUser?.role?.toLowerCase();
  const canEdit = roleLower === "admin" || roleLower === "editor";
  const isAdmin = roleLower === "admin";

  return (
    <AuthContext.Provider
      value={{ currentUser, login, logout, canEdit, isAdmin }}
    >
      {currentUser && <HeartbeatSender userId={currentUser.id} />}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
