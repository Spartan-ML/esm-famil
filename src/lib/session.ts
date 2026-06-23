import { v4 as uuidv4 } from "uuid";
import { SessionData } from "@/types";

const SESSION_KEY = "esm-famil-session";

export function generateToken(): string {
  return uuidv4();
}

export function saveSession(data: SessionData): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function getSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const data: SessionData = JSON.parse(raw);
    if (new Date(data.expiresAt) < new Date()) {
      clearSession();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSessionForRoom(roomCode: string): SessionData | null {
  const session = getSession();
  if (!session) return null;
  if (session.roomCode !== roomCode) return null;
  return session;
}

export function tokenExpiresAt(): string {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  return d.toISOString();
}
