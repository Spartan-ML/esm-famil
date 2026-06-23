-- ============================================================
-- Esm Famil — Supabase Database Migration
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enums
create type room_status as enum ('lobby', 'playing', 'voting', 'scoreboard', 'closed');
create type round_mode as enum ('timer', 'first_to_finish');

-- ============================================================
-- ROOMS
-- ============================================================
create table rooms (
  id                uuid primary key default gen_random_uuid(),
  code              char(6) unique not null,
  host_id           uuid, -- references players.id (set after first player created)
  status            room_status not null default 'lobby',
  round_mode        round_mode not null default 'first_to_finish',
  timer_seconds     int, -- null means no timer
  categories        text[] not null default '{}',
  current_letter    text not null default '',
  current_round     int not null default 1,
  last_winner_id    uuid,
  closed_at         timestamptz,
  created_at        timestamptz not null default now()
);

-- Auto-delete rooms 10 minutes after they're closed
-- (handled via Supabase pg_cron or Vercel cron hitting a cleanup API route)
create index idx_rooms_code on rooms(code);
create index idx_rooms_closed_at on rooms(closed_at) where closed_at is not null;

-- ============================================================
-- PLAYERS
-- ============================================================
create table players (
  id                uuid primary key default gen_random_uuid(),
  room_id           uuid not null references rooms(id) on delete cascade,
  name              text not null,
  color             text not null, -- one of the 8 PlayerColor keys
  total_score       int not null default 0,
  is_host           boolean not null default false,
  is_ready          boolean not null default false,
  session_token     uuid unique not null,
  token_expires_at  timestamptz not null,
  finished_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index idx_players_room_id on players(room_id);
create index idx_players_session_token on players(session_token);

-- ============================================================
-- ANSWERS
-- ============================================================
create table answers (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references rooms(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  round       int not null,
  category    text not null,
  value       text not null default '',
  score       int, -- null until voting is resolved
  created_at  timestamptz not null default now(),
  unique (room_id, player_id, round, category)
);

create index idx_answers_room_round on answers(room_id, round);
create index idx_answers_player_id on answers(player_id);

-- ============================================================
-- VOTES
-- ============================================================
create table votes (
  id          uuid primary key default gen_random_uuid(),
  answer_id   uuid not null references answers(id) on delete cascade,
  voter_id    uuid not null references players(id) on delete cascade,
  is_valid    boolean not null,
  created_at  timestamptz not null default now(),
  unique (answer_id, voter_id)
);

create index idx_votes_answer_id on votes(answer_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table rooms enable row level security;
alter table players enable row level security;
alter table answers enable row level security;
alter table votes enable row level security;

-- Public read on rooms (need to see room by code)
create policy "rooms_select" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (true);
create policy "rooms_update" on rooms for update using (true);

-- Public read/insert/update on players
create policy "players_select" on players for select using (true);
create policy "players_insert" on players for insert with check (true);
create policy "players_update" on players for update using (true);

-- Public read/insert/update on answers
create policy "answers_select" on answers for select using (true);
create policy "answers_insert" on answers for insert with check (true);
create policy "answers_update" on answers for update using (true);

-- Public read/insert on votes
create policy "votes_select" on votes for select using (true);
create policy "votes_insert" on votes for insert with check (true);

-- ============================================================
-- REALTIME
-- Enable realtime on all tables
-- ============================================================
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table answers;
alter publication supabase_realtime add table votes;
