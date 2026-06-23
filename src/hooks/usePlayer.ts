"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Player } from "@/types";
import { PlayerColor } from "@/types";
import { getSession, clearSession } from "@/lib/session";
import { getPlayerByToken } from "@/lib/rooms";
import { useTheme } from "@/lib/theme-context";

export function usePlayer(roomCode: string) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const { setColor } = useTheme();

  const restore = useCallback(async () => {
    const session = getSession();
    if (!session || session.roomCode !== roomCode) {
      router.replace(`/join?code=${roomCode}`);
      return;
    }
    const p = await getPlayerByToken(session.token);
    if (!p) {
      clearSession();
      router.replace(`/join?code=${roomCode}`);
      return;
    }
    setColor(p.color as PlayerColor);
    setPlayer(p);
    setChecked(true);
  }, [roomCode, router, setColor]);

  useEffect(() => { restore(); }, [restore]);

  return { player, checked };
}
