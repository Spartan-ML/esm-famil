"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { PlayerCard } from "@/components/game/PlayerCard";
import { CategoryBuilder } from "@/components/game/CategoryBuilder";
import { LetterPicker } from "@/components/game/LetterPicker";
import { useRoom } from "@/hooks/useRoom";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/locale-context";
import { getSession, clearSession } from "@/lib/session";
import { getPlayerByToken, updateRoom } from "@/lib/rooms";
import { Player, RoundMode } from "@/types";
import { Btn } from "@/components/ui/Btn";
import { supabase } from "@/lib/supabase";

const TIMER_OPTIONS = [30, 60, 90, 120, 180];

export default function LobbyPage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();
  const { theme, setColor } = useTheme();
  const { t, locale } = useLocale();

  const { room, players, loading, error } = useRoom(code);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Host config state
  const [categories, setCategories] = useState<string[]>([]);
  const [letter, setLetter] = useState("");
  const [roundMode, setRoundMode] = useState<RoundMode>("first_to_finish");
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [starting, setStarting] = useState(false);

  // Copy code state
  const [copied, setCopied] = useState(false);

  // ── Session restore ──────────────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const session = getSession();
      if (!session || session.roomCode !== code) {
        router.push(`/join?code=${code}`);
        return;
      }

      const player = await getPlayerByToken(session.token);
      if (!player) {
        clearSession();
        router.push(`/join?code=${code}`);
        return;
      }

      setCurrentPlayer(player);
      setColor(player.color as Parameters<typeof setColor>[0]);
      setSessionChecked(true);
    };
    restore();
  }, [code, router, setColor]);

  // ── Sync room config into host state ─────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    if (categories.length === 0 && room.categories.length > 0) {
      setCategories(room.categories);
    }
    if (!letter && room.current_letter) setLetter(room.current_letter);
    setRoundMode(room.round_mode);
    if (room.timer_seconds) setTimerSeconds(room.timer_seconds);
  }, [room]);

  // ── Watch room status for navigation ─────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    if (room.status === "playing") router.push(`/room/${code}/play`);
    if (room.status === "closed") { clearSession(); router.push("/"); }
  }, [room?.status, code, router]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filledCategories = categories.filter((c) => c?.trim());
  const canStart =
    currentPlayer?.is_host &&
    filledCategories.length >= 5 &&
    letter.trim() !== "" &&
    players.length >= 2;

  const handleStartGame = async () => {
    if (!room || !canStart) return;
    setStarting(true);
    try {
      await updateRoom(room.id, {
        status: "playing",
        categories: filledCategories,
        current_letter: letter,
        round_mode: roundMode,
        timer_seconds: roundMode === "timer" ? timerSeconds : null,
      });
    } catch {
      setStarting(false);
    }
  };

  const handleEndGame = async () => {
    if (!room) return;
    await updateRoom(room.id, { status: "closed", closed_at: new Date().toISOString() });
    clearSession();
    router.push("/");
  };

  if (loading || !sessionChecked) {
    return (
      <PageShell centered>
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
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

  if (error) {
    return (
      <PageShell centered>
        <p className="text-red-400 text-center">{error}</p>
      </PageShell>
    );
  }

  const isHost = currentPlayer?.is_host ?? false;

  return (
    <PageShell centered={false}>
      <div className="max-w-lg mx-auto flex flex-col gap-6 pb-10">

        {/* ── Room Code Banner ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl border ${theme.border} ${theme.bgMuted} backdrop-blur-sm p-5 text-center`}
        >
          <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${theme.textMuted}`}>
            {t.shareCode}
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-4xl font-black tracking-[0.25em] ${theme.text}`}>{code}</span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCopyCode}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${theme.button} ${theme.buttonHover} transition-colors`}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={copied ? "copied" : "copy"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  {copied ? t.codeCopied : t.copyCode}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        {/* ── Players List ─────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>
            {t.playersJoined} ({players.length})
          </h2>
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {players.map((p, i) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  isCurrentPlayer={p.id === currentPlayer?.id}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ── Host Config Panel ─────────────────────────────────────── */}
        {isHost ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* Categories */}
            <section>
              <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>
                {t.categories}
              </h2>
              <CategoryBuilder value={categories} onChange={setCategories} />
            </section>

            {/* Round mode */}
            <section>
              <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>
                {t.roundMode}
              </h2>
              <div className={`flex rounded-xl border ${theme.border} ${theme.bgMuted} p-1 gap-1`}>
                {(["first_to_finish", "timer"] as RoundMode[]).map((mode) => {
                  const active = roundMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setRoundMode(mode)}
                      className={`relative flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors z-10
                        ${active ? theme.textOnStrong : theme.textMuted}`}
                    >
                      {active && (
                        <motion.div
                          layoutId="mode-pill"
                          className={`absolute inset-0 rounded-lg ${theme.bgStrong}`}
                          style={{ zIndex: -1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                      )}
                      {mode === "first_to_finish" ? `🏁 ${t.finishMode}` : `⏱ ${t.timerMode}`}
                    </button>
                  );
                })}
              </div>

              {/* Timer duration */}
              <AnimatePresence>
                {roundMode === "timer" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3">
                      <p className={`text-xs mb-2 ${theme.textMuted}`}>{t.timerDuration}</p>
                      <div className="flex gap-2 flex-wrap">
                        {TIMER_OPTIONS.map((sec) => (
                          <button
                            key={sec}
                            onClick={() => setTimerSeconds(sec)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all
                              ${timerSeconds === sec
                                ? `${theme.bgStrong} ${theme.textOnStrong} border-transparent`
                                : `${theme.bgMuted} ${theme.textMuted} ${theme.border}`
                              }`}
                          >
                            {sec}{t.seconds}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Letter picker */}
            <section>
              <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>
                {t.chooseLetter}
              </h2>
              <LetterPicker selected={letter} onChange={setLetter} />
            </section>

            {/* Start / End buttons */}
            <div className="flex flex-col gap-3 pt-2">
              {/* "Need 2 players" hint */}
              {players.length < 2 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-xs text-center ${theme.textMuted}`}
                >
                  {t.needMorePlayers}
                </motion.p>
              )}

              <Btn size="lg" fullWidth loading={starting} disabled={!canStart} onClick={handleStartGame}>
                {t.startGame}
              </Btn>

              <Btn size="md" fullWidth variant="ghost" onClick={handleEndGame}>
                {t.endGame}
              </Btn>
            </div>
          </motion.div>
        ) : (
          /* ── Non-host waiting view ──────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl border ${theme.border} ${theme.bgMuted} backdrop-blur-sm p-6 text-center`}
          >
            <motion.div
              className="flex justify-center gap-1.5 mb-4"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${theme.bgStrong}`}
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
            <p className={`font-semibold ${theme.text}`}>{t.waitingForHost}</p>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
