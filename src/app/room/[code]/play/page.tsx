"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { usePlayer } from "@/hooks/usePlayer";
import { useAnswers } from "@/hooks/useAnswers";
import { useTimer } from "@/hooks/useTimer";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/locale-context";
import { PageShell } from "@/components/layout/PageShell";
import { supabase } from "@/lib/supabase";
import { updateRoom } from "@/lib/rooms";
import { COLOR_THEMES, DEFAULT_THEME } from "@/lib/colors";
import { PlayerColor } from "@/types";

export default function PlayPage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();
  const { theme } = useTheme();
  const { t, locale } = useLocale();

  const { room, players } = useRoom(code);
  const { player, checked } = usePlayer(code);
  const [locked, setLocked] = useState(false);
  const [finisherName, setFinisherName] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const lockFired = useRef(false);

  const categories = room?.categories ?? [];
  const isTimerMode = room?.round_mode === "timer";

  const { answers, handleChange, flushAll } = useAnswers(
    room?.id ?? "",
    player?.id ?? "",
    room?.current_round ?? 1,
    categories
  );

  // ── Lock round and move to voting ───────────────────────────────────────
  const lockRound = useCallback(async (finisherId?: string) => {
    if (lockFired.current || !room) return;
    lockFired.current = true;

    await flushAll();

    // Only the finisher (or timer host) pushes the status update
    if (finisherId === player?.id || (!finisherId && player?.is_host)) {
      await updateRoom(room.id, {
        status: "voting",
        last_winner_id: finisherId ?? null,
      });
    }
  }, [room, player, flushAll]);

  // ── Timer expiry ─────────────────────────────────────────────────────────
  const handleTimerExpire = useCallback(async () => {
    if (locked) return;
    setLocked(true);
    await lockRound(undefined);
  }, [locked, lockRound]);

  const timerActive = !locked && isTimerMode && !!room;
  const { remaining, pct } = useTimer(
    isTimerMode ? (room?.timer_seconds ?? 60) : null,
    timerActive,
    handleTimerExpire
  );

  // ── Watch room status for navigation ────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    if (room.status === "voting") router.replace(`/room/${code}/vote`);
    if (room.status === "scoreboard") router.replace(`/room/${code}/scoreboard`);
    if (room.status === "lobby") router.replace(`/room/${code}`);
    if (room.status === "closed") router.replace("/");
  }, [room?.status, code, router]);

  // ── Watch for someone claiming "Finished" ───────────────────────────────
  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`play-finished-${code}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "players",
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        const p = payload.new as { id: string; finished_at: string | null; name: string };
        if (p.finished_at && !locked) {
          setLocked(true);
          setFinisherName(p.name);
          lockRound(p.id);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id, code, locked, lockRound]);

  // ── "I'm Finished" handler ───────────────────────────────────────────────
  const handleFinish = async () => {
    if (locked || finishing || !player || !room) return;
    setFinishing(true);
    await flushAll();
    await supabase.from("players")
      .update({ finished_at: new Date().toISOString() })
      .eq("id", player.id);
    setLocked(true);
    setFinisherName(player.name);
    await lockRound(player.id);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!checked || !room || !player) {
    return (
      <PageShell centered>
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className={`w-10 h-10 rounded-full border-4 ${theme.border} border-t-transparent`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className={theme.textMuted}>Loading…</p>
        </motion.div>
      </PageShell>
    );
  }

  const filledCount = Object.values(answers).filter((v) => v.trim()).length;

  return (
    <PageShell centered={false}>
      <div className="max-w-lg mx-auto flex flex-col gap-5 pb-24">

        {/* ── Header: Round + Letter ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border ${theme.border} ${theme.bgMuted} backdrop-blur-sm p-4 flex items-center justify-between`}
        >
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest ${theme.textMuted}`}>
              {t.round} {room.current_round}
            </p>
            <p className={`text-sm font-medium mt-0.5 ${theme.textMuted}`}>
              {filledCount}/{categories.length} {t.categories}
            </p>
          </div>

          {/* Letter reveal */}
          <motion.div
            key={room.current_letter}
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            className={`w-16 h-16 rounded-2xl ${theme.bgStrong} flex items-center justify-center shadow-lg`}
          >
            <span
              className={`text-3xl font-black ${theme.textOnStrong}`}
              style={{ fontFamily: locale === "fa" ? "Tahoma, sans-serif" : "inherit" }}
            >
              {room.current_letter}
            </span>
          </motion.div>
        </motion.div>

        {/* ── Timer bar (timer mode only) ── */}
        <AnimatePresence>
          {isTimerMode && remaining !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${theme.textMuted}`}>{t.timeLeft}</span>
                <motion.span
                  key={remaining}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className={`text-sm font-black tabular-nums ${
                    remaining <= 10 ? "text-red-400" : theme.text
                  }`}
                >
                  {remaining}s
                </motion.span>
              </div>
              <div className={`w-full h-2 rounded-full ${theme.bgMuted} overflow-hidden`}>
                <motion.div
                  className={`h-full rounded-full ${pct <= 20 ? "bg-red-500" : theme.bgStrong}`}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Lock overlay notification ── */}
        <AnimatePresence>
          {locked && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`rounded-2xl border ${theme.border} ${theme.bgStrong} p-4 text-center`}
            >
              {finisherName ? (
                <p className={`font-bold ${theme.textOnStrong}`}>
                  🏁 <span className="underline">{finisherName}</span> {t.someoneFinished}
                </p>
              ) : (
                <p className={`font-bold ${theme.textOnStrong}`}>⏱ {t.inputsLocked}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Answer inputs ── */}
        <div className="flex flex-col gap-3">
          {categories.map((cat, i) => {
            const val = answers[cat] ?? "";
            const filled = val.trim().length > 0;
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
                className={`rounded-2xl border ${theme.border} ${theme.bgMuted} backdrop-blur-sm overflow-hidden`}
              >
                {/* Category label */}
                <div className={`px-4 pt-3 pb-1 flex items-center justify-between`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>
                    {cat}
                  </span>
                  <AnimatePresence>
                    {filled && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className={`text-xs px-2 py-0.5 rounded-full ${theme.bgStrong} ${theme.textOnStrong} font-semibold`}
                      >
                        ✓
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input */}
                <div className="px-4 pb-3">
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => !locked && handleChange(cat, e.target.value)}
                    disabled={locked}
                    placeholder={`${room.current_letter}…`}
                    className={`w-full bg-transparent text-lg font-semibold outline-none transition-all
                      ${theme.text} placeholder:text-current placeholder:opacity-20
                      disabled:opacity-40 disabled:cursor-not-allowed`}
                    style={{ fontFamily: locale === "fa" ? "Tahoma, sans-serif" : "inherit" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Finish button (first_to_finish mode) ── */}
        <AnimatePresence>
          {!isTimerMode && !locked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-6 left-0 right-0 flex justify-center px-5 z-40"
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleFinish}
                disabled={finishing}
                className={`px-10 py-4 rounded-2xl text-lg font-black shadow-2xl transition-all
                  ${theme.button} ${theme.buttonHover}
                  disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {finishing ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                    />
                    {t.iFinished}
                  </span>
                ) : (
                  `🏁 ${t.iFinished}`
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Player status dots ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`flex flex-wrap gap-2 pt-2`}
        >
          {players.map((p) => {
            const pTheme = COLOR_THEMES[p.color as PlayerColor] ?? DEFAULT_THEME;
            const done = !!p.finished_at;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
                  ${done ? "" : "opacity-60"}`}
                style={{
                  backgroundColor: pTheme.swatch + "22",
                  borderColor: pTheme.swatch + "55",
                  color: pTheme.swatch,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: pTheme.swatch }}
                />
                {p.name}
                {done && " ✓"}
              </div>
            );
          })}
        </motion.div>

      </div>
    </PageShell>
  );
}
