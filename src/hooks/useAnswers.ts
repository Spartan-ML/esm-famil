"use client";

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export function useAnswers(roomId: string, playerId: string, round: number, categories: string[]) {
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(categories.map((c) => [c, ""]))
  );
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleChange = useCallback((category: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [category]: value }));

    // Debounced upsert — 600ms after the user stops typing
    clearTimeout(saveTimers.current[category]);
    saveTimers.current[category] = setTimeout(async () => {
      await supabase.from("answers").upsert(
        { room_id: roomId, player_id: playerId, round, category, value: value.trim() },
        { onConflict: "room_id,player_id,round,category" }
      );
    }, 600);
  }, [roomId, playerId, round]);

  // Flush all unsaved answers immediately (called before locking)
  const flushAll = useCallback(async () => {
    Object.values(saveTimers.current).forEach(clearTimeout);
    const rows = categories.map((cat) => ({
      room_id: roomId,
      player_id: playerId,
      round,
      category: cat,
      value: (answers[cat] ?? "").trim(),
    }));
    await supabase.from("answers").upsert(rows, {
      onConflict: "room_id,player_id,round,category",
    });
  }, [roomId, playerId, round, categories, answers]);

  return { answers, handleChange, flushAll };
}
