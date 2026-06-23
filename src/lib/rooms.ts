import { supabase } from "./supabase";
import { Room, Player, PlayerColor } from "@/types";
import { generateToken, tokenExpiresAt } from "./session";

// ─── Room Code ───────────────────────────────────────────────────────────────

export async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const { data } = await supabase
      .from("rooms")
      .select("code")
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique room code.");
}

// ─── Room ────────────────────────────────────────────────────────────────────

export async function getRoomByCode(code: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRoom(code: string): Promise<Room> {
  const { data, error } = await supabase
    .from("rooms")
    .insert({ code })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoom(
  id: string,
  updates: Partial<Room>
): Promise<void> {
  const { error } = await supabase.from("rooms").update(updates).eq("id", id);
  if (error) throw error;
}

// ─── Player ──────────────────────────────────────────────────────────────────

export async function getPlayersByRoom(roomId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getPlayerByToken(token: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("session_token", token)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPlayer(params: {
  roomId: string;
  name: string;
  color: PlayerColor;
  isHost: boolean;
}): Promise<{ player: Player; token: string }> {
  const token = generateToken();
  const expiresAt = tokenExpiresAt();

  const { data, error } = await supabase
    .from("players")
    .insert({
      room_id: params.roomId,
      name: params.name,
      color: params.color,
      is_host: params.isHost,
      session_token: token,
      token_expires_at: expiresAt,
    })
    .select()
    .single();
  if (error) throw error;
  return { player: data, token };
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

export async function computeAndSaveScores(
  roomId: string,
  round: number
): Promise<void> {
  // Fetch all answers for this round
  const { data: answers, error } = await supabase
    .from("answers")
    .select("*, votes(*)")
    .eq("room_id", roomId)
    .eq("round", round);
  if (error) throw error;

  const totalPlayers = await supabase
    .from("players")
    .select("id", { count: "exact" })
    .eq("room_id", roomId);
  const playerCount = totalPlayers.count ?? 1;

  for (const answer of answers ?? []) {
    if (!answer.value.trim()) {
      await supabase.from("answers").update({ score: 0 }).eq("id", answer.id);
      continue;
    }

    const votes = answer.votes ?? [];
    const invalidCount = votes.filter((v: { is_valid: boolean }) => !v.is_valid).length;
    const majority = invalidCount > (playerCount - 1) / 2;

    if (majority) {
      await supabase.from("answers").update({ score: 0 }).eq("id", answer.id);
      continue;
    }

    // Check for duplicate valid answers in same category
    const sameCategory = (answers ?? []).filter(
      (a) =>
        a.category === answer.category &&
        a.id !== answer.id &&
        a.value.trim().toLowerCase() === answer.value.trim().toLowerCase()
    );

    const score = sameCategory.length > 0 ? 1 : 2;
    await supabase.from("answers").update({ score }).eq("id", answer.id);
  }

  // Update player total scores
  const { data: allAnswers } = await supabase
    .from("answers")
    .select("player_id, score")
    .eq("room_id", roomId)
    .eq("round", round);

  const scoreMap = new Map<string, number>();
  for (const a of allAnswers ?? []) {
    scoreMap.set(a.player_id, (scoreMap.get(a.player_id) ?? 0) + (a.score ?? 0));
  }

  for (const [playerId, roundScore] of scoreMap.entries()) {
    const { data: player } = await supabase
      .from("players")
      .select("total_score")
      .eq("id", playerId)
      .single();
    if (player) {
      await supabase
        .from("players")
        .update({ total_score: player.total_score + roundScore })
        .eq("id", playerId);
    }
  }
}
