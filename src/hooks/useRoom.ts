"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Room, Player } from "@/types";

export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Keep a ref so the realtime callback always has the latest room id
  const roomIdRef = useRef<string | null>(null);

  const fetchPlayers = useCallback(async (roomId: string) => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });
    if (!error && data) setPlayers(data);
  }, []);

  const fetchRoom = useCallback(async () => {
    setLoading(true);
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (roomError) { setError(roomError.message); setLoading(false); return; }
    if (!roomData) { setError("Room not found"); setLoading(false); return; }

    setRoom(roomData);
    roomIdRef.current = roomData.id;
    await fetchPlayers(roomData.id);
    setLoading(false);
  }, [code, fetchPlayers]);

  useEffect(() => {
    fetchRoom();

    const channel = supabase
      .channel(`room-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            setRoom(payload.new as Room);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => {
          // Use the ref so we always have the current room id even in a closure
          if (roomIdRef.current) fetchPlayers(roomIdRef.current);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [code, fetchRoom, fetchPlayers]);

  return { room, players, loading, error, refetch: fetchRoom };
}
