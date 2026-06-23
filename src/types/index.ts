export type Locale = "fa" | "en";

export type PlayerColor =
  | "blue"
  | "purple"
  | "brown"
  | "green"
  | "red"
  | "yellow"
  | "pink"
  | "orange";

export type RoomStatus =
  | "lobby"
  | "playing"
  | "voting"
  | "scoreboard"
  | "closed";

export type RoundMode = "timer" | "first_to_finish";

export interface Room {
  id: string;
  code: string;
  host_id: string;
  status: RoomStatus;
  round_mode: RoundMode;
  timer_seconds: number | null;
  categories: string[];
  current_letter: string;
  current_round: number;
  last_winner_id: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  color: PlayerColor;
  total_score: number;
  is_host: boolean;
  is_ready: boolean;
  session_token: string;
  token_expires_at: string;
  finished_at: string | null;
}

export interface Answer {
  id: string;
  room_id: string;
  player_id: string;
  round: number;
  category: string;
  value: string;
  score: number | null;
}

export interface Vote {
  id: string;
  answer_id: string;
  voter_id: string;
  is_valid: boolean;
}

export interface SessionData {
  token: string;
  playerId: string;
  roomCode: string;
  expiresAt: string;
}
