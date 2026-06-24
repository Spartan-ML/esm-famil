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
import { supabase } from "@/lib/supabase";
import { updateRoom, computeAndSaveScores } from "@/lib/rooms";
import { Answer, Player } from "@/types";
import { COLOR_THEMES, DEFAULT_THEME } from "@/lib/colors";
import { PlayerColor } from "@/types";

type VoteMap = Record<string, boolean>; // answerId → is_valid

export default function VotePage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLocale();

  const { room, players } = useRoom(code);
  const { player, checked } = usePlayer(code);

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [votes, setVotes] = useState<VoteMap>({});
  const [submittedPlayers, setSubmittedPlayers] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);

  const categories = room?.categories ?? [];
  const activeCategory = categories[activeCategoryIdx] ?? "";

  // ── Fetch all answers for this round ────────────────────────────────────
  const fetchAnswers = useCallback(async () => {
    if (!room) return;
    const { data } = await supabase
      .from("answers")
      .select("*")
      .eq("room_id", room.id)
      .eq("round", room.current_round);
    if (data) setAnswers(data);
  }, [room?.id, room?.current_round]);

  useEffect(() => { fetchAnswers(); }, [fetchAnswers]);

  // ── Watch who has submitted votes ────────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`votes-watch-${code}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "votes",
      }, async () => {
        // Re-check who has voted on any answer this round
        const roundAnswerIds = answers.map((a) => a.id);
        if (!roundAnswerIds.length) return;
        const { data } = await supabase
          .from("votes")
          .select("voter_id")
          .in("answer_id", roundAnswerIds);
        if (data) {
          const ids = new Set(data.map((v: { voter_id: string }) => v.voter_id));
          setSubmittedPlayers(ids);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id, code, answers]);

  // ── Auto-advance when ALL players have submitted ─────────────────────────
  useEffect(() => {
    if (!room || !players.length || !answers.length) return;
    const allSubmitted = players.every((p) => submittedPlayers.has(p.id));
    if (allSubmitted && !submitting) {
      handleAllVotesIn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedPlayers, players.length]);

  // ── Navigate on room status change ──────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    if (room.status === "scoreboard") router.replace(`/room/${code}/scoreboard`);
    if (room.status === "playing") router.replace(`/room/${code}/play`);
    if (room.status === "closed") router.replace("/");
  }, [room?.status, code, router]);

  // ── All votes in → compute scores → scoreboard ──────────────────────────
  const handleAllVotesIn = useCallback(async () => {
    if (!room || !player?.is_host) return;
    setSubmitting(true);
    await computeAndSaveScores(room.id, room.current_round);
    await updateRoom(room.id, { status: "scoreboard" });
  }, [room, player]);

  // ── Submit votes ─────────────────────────────────────────────────────────
  const handleSubmitVotes = async () => {
    if (!player || !room || hasSubmitted) return;
    setSubmitting(true);

    // Build vote rows: only for answers by OTHER players with a value
    const otherAnswers = answers.filter(
      (a) => a.player_id !== player.id && a.value.trim()
    );

    const rows = otherAnswers.map((a) => ({
      answer_id: a.id,
      voter_id: player.id,
      // Default valid unless the voter explicitly marked invalid
      is_valid: votes[a.id] !== false,
    }));

    if (rows.length > 0) {
      await supabase.from("votes").upsert(rows, { onConflict: "answer_id,voter_id" });
    }

    setHasSubmitted(true);
    setSubmittedPlayers((prev) => new Set([...prev, player.id]));
    setSubmitting(false);
  };

  // ── Toggle invalid vote ──────────────────────────────────────────────────
  const toggleVote = (answerId: string) => {
    if (hasSubmitted) return;
    setVotes((prev) => ({
      ...prev,
      [answerId]: prev[answerId] === false ? true : false,
    }));
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
        </motion.div>
      </PageShell>
    );
  }

  const categoryAnswers = answers.filter((a) => a.category === activeCategory && a.value.trim());
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const submittedCount = players.filter((p) => submittedPlayers.has(p.id)).length;

  return (
    <PageShell centered={false}>
      <div className="max-w-lg mx-auto flex flex-col gap-5 pb-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border ${theme.border} ${theme.bgMuted} backdrop-blur-sm p-4`}
        >
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>
              {t.votingPhase} — {t.round} {room.current_round}
            </p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${theme.bgStrong} ${theme.textOnStrong}`}>
              {submittedCount}/{players.length}
            </span>
          </div>
          <p className={`text-sm ${theme.textMuted}`}>{t.voteInstruction}</p>
        </motion.div>

        {/* ── Category tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat, i) => {
            const active = i === activeCategoryIdx;
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategoryIdx(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border
                  ${active
                    ? `${theme.bgStrong} ${theme.textOnStrong} border-transparent`
                    : `${theme.bgMuted} ${theme.textMuted} ${theme.border}`
                  }`}
              >
                {cat}
              </motion.button>
            );
          })}
        </div>

        {/* ── Answer cards for active category ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {players.map((p, i) => {
              const ans = answers.find(
                (a) => a.player_id === p.id && a.category === activeCategory
              );
              const pTheme = COLOR_THEMES[p.color as PlayerColor] ?? DEFAULT_THEME;
              const isSelf = p.id === player.id;
              const isInvalid = votes[ans?.id ?? ""] === false;
              const hasValue = ans?.value?.trim();

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border-2 overflow-hidden transition-all
                    ${isInvalid ? "opacity-50" : ""}`}
                  style={{ borderColor: pTheme.swatch + "55" }}
                >
                  <div
                    className="px-4 py-3 flex items-center justify-between gap-3"
                    style={{ backgroundColor: pTheme.swatch + "18" }}
                  >
                    {/* Player name + answer */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: pTheme.swatch }}
                        />
                        <span className="text-xs font-bold" style={{ color: pTheme.swatch }}>
                          {p.name}
                          {isSelf && <span className="opacity-60 font-normal"> ({t.yourAnswer})</span>}
                        </span>
                      </div>
                      <p className={`text-base font-semibold truncate ${theme.text} ${!hasValue ? "opacity-30 italic" : ""}`}>
                        {hasValue || t.noAnswer}
                      </p>
                    </div>

                    {/* Invalid toggle (only for other players' answers) */}
                    {!isSelf && hasValue && !hasSubmitted && (
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleVote(ans!.id)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                          ${isInvalid
                            ? "bg-red-500/20 border-red-500/50 text-red-400"
                            : `${theme.bgMuted} ${theme.border} ${theme.textMuted}`
                          }`}
                      >
                        {isInvalid ? `✕ ${t.invalid}` : `✓ ${t.valid}`}
                      </motion.button>
                    )}

                    {/* Post-submission badge */}
                    {!isSelf && hasValue && hasSubmitted && (
                      <span className={`text-xs px-2 py-1 rounded-lg font-semibold
                        ${isInvalid ? "bg-red-500/20 text-red-400" : `${theme.bgStrong} ${theme.textOnStrong}`}`}>
                        {isInvalid ? t.invalid : t.valid}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {categoryAnswers.length === 0 && (
              <p className={`text-center text-sm py-6 ${theme.textMuted}`}>{t.noAnswer}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Submit votes button ── */}
        <AnimatePresence>
          {!hasSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pt-2"
            >
              <Btn size="lg" fullWidth loading={submitting} onClick={handleSubmitVotes}>
                {t.submitVotes}
              </Btn>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Waiting for others ── */}
        <AnimatePresence>
          {hasSubmitted && submittedCount < players.length && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border ${theme.border} ${theme.bgMuted} p-5 text-center`}
            >
              <div className="flex justify-center gap-1.5 mb-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${theme.bgStrong}`}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                ))}
              </div>
              <p className={`text-sm ${theme.textMuted}`}>
                {submittedCount}/{players.length} {t.submitVotes}
              </p>

              {/* Per-player submitted indicators */}
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {players.map((p) => {
                  const pTheme = COLOR_THEMES[p.color as PlayerColor] ?? DEFAULT_THEME;
                  const done = submittedPlayers.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: pTheme.swatch + (done ? "33" : "11"),
                        color: pTheme.swatch,
                        opacity: done ? 1 : 0.4,
                      }}
                    >
                      {p.name} {done && "✓"}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageShell>
  );
}
