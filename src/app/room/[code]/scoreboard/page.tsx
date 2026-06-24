"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { usePlayer } from "@/hooks/usePlayer";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/locale-context";
import { Btn } from "@/components/ui/Btn";
import { PageShell } from "@/components/layout/PageShell";
import { LetterPicker } from "@/components/game/LetterPicker";
import { supabase } from "@/lib/supabase";
import { updateRoom } from "@/lib/rooms";
import { clearSession } from "@/lib/session";
import { Answer, Player } from "@/types";
import { COLOR_THEMES, DEFAULT_THEME } from "@/lib/colors";
import { PlayerColor } from "@/types";

export default function ScoreboardPage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();
  const { theme } = useTheme();
  const { t, locale } = useLocale();

  const { room, players } = useRoom(code);
  const { player, checked } = usePlayer(code);

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [nextLetter, setNextLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = room?.categories ?? [];
  const isWinner = room?.last_winner_id === player?.id;
  const isHost = player?.is_host ?? false;

  // ── Fetch answers for this round ────────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    supabase
      .from("answers")
      .select("*")
      .eq("room_id", room.id)
      .eq("round", room.current_round)
      .then(({ data }) => { if (data) setAnswers(data); });
  }, [room?.id, room?.current_round]);

  // ── Navigate on room status change ──────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    if (room.status === "playing") router.replace(`/room/${code}/play`);
    if (room.status === "voting") router.replace(`/room/${code}/vote`);
    if (room.status === "closed") { clearSession(); router.replace("/"); }
  }, [room?.status, code, router]);

  // ── Sorted players by total score ────────────────────────────────────────
  const ranked = [...players].sort((a, b) => b.total_score - a.total_score);

  // ── Next round ─────────────────────────────────────────────────────────
  const handleNextRound = async () => {
    if (!room || !nextLetter) return;
    setLoading(true);
    // Reset player finished_at for all players in this room
    await supabase
      .from("players")
      .update({ finished_at: null })
      .eq("room_id", room.id);
    await updateRoom(room.id, {
      status: "playing",
      current_round: room.current_round + 1,
      current_letter: nextLetter,
      last_winner_id: null,
    });
  };

  // ── End game ────────────────────────────────────────────────────────────
  const handleEndGame = async () => {
    if (!room) return;
    setLoading(true);
    await updateRoom(room.id, {
      status: "closed",
      closed_at: new Date().toISOString(),
    });
    clearSession();
    router.replace("/");
  };

  // ── Round score for a player ─────────────────────────────────────────────
  const getRoundScore = (playerId: string) =>
    answers
      .filter((a) => a.player_id === playerId)
      .reduce((sum, a) => sum + (a.score ?? 0), 0);

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
        </motion.div>
      </PageShell>
    );
  }

  const winner = ranked[0];
  const winnerTheme = COLOR_THEMES[winner?.color as PlayerColor] ?? DEFAULT_THEME;

  return (
    <PageShell centered={false}>
      <div className="max-w-lg mx-auto flex flex-col gap-6 pb-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <motion.p
            className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme.textMuted}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {t.round} {room.current_round} — {t.scoreboard}
          </motion.p>

          {/* Letter badge */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl ${theme.bgMuted} border ${theme.border} mt-1`}
          >
            <span className={`text-xs font-semibold ${theme.textMuted}`}>{t.letter}</span>
            <span
              className={`text-2xl font-black ${theme.text}`}
              style={{ fontFamily: locale === "fa" ? "Tahoma, sans-serif" : "inherit" }}
            >
              {room.current_letter}
            </span>
          </motion.div>
        </motion.div>

        {/* ── Leaderboard ── */}
        <div className="flex flex-col gap-2">
          {ranked.map((p, i) => {
            const pTheme = COLOR_THEMES[p.color as PlayerColor] ?? DEFAULT_THEME;
            const roundScore = getRoundScore(p.id);
            const isFirst = i === 0;
            const isSelf = p.id === player.id;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 240, damping: 22 }}
                className={`rounded-2xl border-2 overflow-hidden ${isSelf ? "ring-2 ring-offset-1 ring-offset-transparent" : ""}`}
                style={{
                  borderColor: pTheme.swatch + "55",
                }}
              >
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ backgroundColor: pTheme.swatch + "18" }}
                >
                  {/* Rank */}
                  <motion.div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0`}
                    style={{
                      backgroundColor: pTheme.swatch + (isFirst ? "cc" : "33"),
                      color: isFirst ? "#fff" : pTheme.swatch,
                    }}
                    animate={isFirst ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    {isFirst ? "🥇" : i + 1}
                  </motion.div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pTheme.swatch }} />
                      <span className={`font-bold text-sm truncate ${theme.text}`}>
                        {p.name}
                        {isSelf && <span className={`ml-1 text-xs font-normal ${theme.textMuted}`}>(you)</span>}
                      </span>
                    </div>
                    {/* Round score breakdown */}
                    <p className={`text-xs mt-0.5`} style={{ color: pTheme.swatch + "aa" }}>
                      +{roundScore} {t.pts} {t.round.toLowerCase()} {room.current_round}
                    </p>
                  </div>

                  {/* Total score */}
                  <div className="text-right flex-shrink-0">
                    <motion.p
                      key={p.total_score}
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl font-black"
                      style={{ color: pTheme.swatch }}
                    >
                      {p.total_score}
                    </motion.p>
                    <p className={`text-xs ${theme.textMuted}`}>{t.score}</p>
                  </div>
                </div>

                {/* Expandable answers per category */}
                <button
                  onClick={() => setExpandedCategory(expandedCategory === p.id ? null : p.id)}
                  className={`w-full px-4 py-2 text-xs font-semibold text-left transition-opacity hover:opacity-70`}
                  style={{ color: pTheme.swatch + "99" }}
                >
                  {expandedCategory === p.id ? "▲" : "▼"} {t.categories}
                </button>

                <AnimatePresence>
                  {expandedCategory === p.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 280, damping: 28 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                        {categories.map((cat) => {
                          const ans = answers.find(
                            (a) => a.player_id === p.id && a.category === cat
                          );
                          const score = ans?.score ?? 0;
                          return (
                            <div key={cat} className="flex flex-col">
                              <span className={`text-xs ${theme.textMuted} truncate`}>{cat}</span>
                              <span className={`text-sm font-semibold ${theme.text} truncate`}>
                                {ans?.value?.trim() || <span className="opacity-30 italic">{t.noAnswer}</span>}
                              </span>
                              <span
                                className="text-xs font-bold mt-0.5"
                                style={{
                                  color: score === 2
                                    ? "#4ade80"
                                    : score === 1
                                    ? "#facc15"
                                    : "#f87171",
                                }}
                              >
                                {score === 2
                                  ? `+2 ${t.unique}`
                                  : score === 1
                                  ? `+1 ${t.shared}`
                                  : `0 ${ans?.value?.trim() ? t.invalid : t.empty}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* ── Next round controls (winner picks letter, host starts) ── */}
        <AnimatePresence>
          {(isWinner || isHost) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + ranked.length * 0.08 }}
              className={`rounded-2xl border ${theme.border} ${theme.bgMuted} backdrop-blur-sm p-5 flex flex-col gap-4`}
            >
              <div>
                <p className={`text-sm font-bold ${theme.text} mb-0.5`}>
                  {isWinner ? `🏆 ${t.winner}!` : ""} {t.pickLetter}
                </p>
                <p className={`text-xs ${theme.textMuted}`}>
                  {isWinner
                    ? locale === "fa"
                      ? "برنده راند قبلی حرف بعدی را انتخاب می‌کند"
                      : "As the round winner, you pick the next letter."
                    : locale === "fa"
                      ? "به عنوان میزبان می‌توانید حرف را انتخاب کنید"
                      : "As host, you can set the next letter."}
                </p>
              </div>

              <LetterPicker selected={nextLetter} onChange={setNextLetter} />

              <div className="flex flex-col gap-3 pt-1">
                <Btn size="lg" fullWidth loading={loading} disabled={!nextLetter} onClick={handleNextRound}>
                  ▶ {t.nextRound}
                </Btn>

                {isHost && (
                  <Btn size="md" fullWidth variant="ghost" disabled={loading} onClick={handleEndGame}>
                    {t.endGame}
                  </Btn>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Non-winner/non-host waiting view ── */}
        <AnimatePresence>
          {!isWinner && !isHost && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + ranked.length * 0.08 }}
              className={`rounded-2xl border ${theme.border} ${theme.bgMuted} p-5 text-center`}
            >
              <div className="flex justify-center gap-1.5 mb-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${theme.bgStrong}`}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </div>
              <p className={`text-sm font-semibold ${theme.text}`}>
                {locale === "fa"
                  ? `در انتظار انتخاب حرف توسط ${winner?.name ?? "برنده"}…`
                  : `Waiting for ${winner?.name ?? "the winner"} to pick the next letter…`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageShell>
  );
}
