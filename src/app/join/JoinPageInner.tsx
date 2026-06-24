"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Btn } from "@/components/ui/Btn";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/locale-context";
import { PlayerColor } from "@/types";
import { getRoomByCode, createPlayer, getPlayersByRoom } from "@/lib/rooms";
import { saveSession } from "@/lib/session";
import { COLOR_THEMES } from "@/lib/colors";

type Step = "code" | "profile";

export default function JoinPageInner() {
  const { theme, setColor } = useTheme();
  const { t } = useLocale();
  const router   = useRouter();
  const params   = useSearchParams();

  const [step, setStep]                   = useState<Step>("code");
  const [code, setCode]                   = useState(params.get("code") ?? "");
  const [selectedColor, setSelectedColor] = useState<PlayerColor | null>(null);
  const [name, setName]                   = useState("");
  const [takenColors, setTakenColors]     = useState<PlayerColor[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [roomId, setRoomId]               = useState<string | null>(null);

  /* Auto-submit if code came from query param */
  useEffect(() => {
    if (params.get("code")) handleCodeSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCodeSubmit = async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const room = await getRoomByCode(trimmed);
      if (!room)                    { setError(t.invalidCode);                   setLoading(false); return; }
      if (room.status === "closed") { setError(t.roomClosed);                    setLoading(false); return; }
      if (room.status !== "lobby")  { setError("This game has already started."); setLoading(false); return; }
      const players = await getPlayersByRoom(room.id);
      setTakenColors(players.map((p) => p.color as PlayerColor));
      setRoomId(room.id);
      setStep("profile");
    } catch {
      setError(t.errorGeneric);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim() || !selectedColor || !roomId) return;
    setLoading(true);
    setError(null);
    try {
      setColor(selectedColor);
      const { player, token } = await createPlayer({ roomId, name: name.trim(), color: selectedColor, isHost: false });
      saveSession({ token, playerId: player.id, roomCode: code.trim(), expiresAt: player.token_expires_at });
      router.push(`/room/${code.trim()}`);
    } catch {
      setError(t.errorGeneric);
      setLoading(false);
    }
  };

  const slide = { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 } };

  return (
    <PageShell showBack centered>
      <AnimatePresence mode="wait">

        {/* ── Step 1: Code ── */}
        {step === "code" && (
          <motion.div key="code-step" {...slide} transition={{ duration: 0.3 }} className="flex flex-col gap-6">
            <div className="text-center">
              <motion.h1 className={`text-2xl font-black mb-1 ${theme.text}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                {t.joinGame}
              </motion.h1>
              <motion.p className={`text-sm ${theme.textMuted}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                {t.enterCode}
              </motion.p>
            </div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                placeholder="000000"
                autoFocus
                className={`w-full px-5 py-5 rounded-2xl border text-3xl font-black text-center tracking-[0.4em] outline-none transition-all
                  bg-white/5 ${theme.border} ${theme.text} placeholder:opacity-20
                  focus:ring-2 ${theme.ring} focus:border-transparent
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
              {/* Progress dots */}
              <div className="flex justify-center gap-2 mt-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i < code.length ? theme.bgStrong : theme.bgMuted}`}
                    animate={{ scale: i < code.length ? 1.2 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  />
                ))}
              </div>
            </motion.div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
                {error}
              </motion.p>
            )}

            <Btn size="lg" fullWidth loading={loading} disabled={code.length !== 6} onClick={handleCodeSubmit}>
              {t.join} →
            </Btn>
          </motion.div>
        )}

        {/* ── Step 2: Color + Name ── */}
        {step === "profile" && (
          <motion.div key="profile-step" {...slide} transition={{ duration: 0.3 }} className="flex flex-col gap-6">
            <div className="text-center">
              <motion.h1 className={`text-2xl font-black mb-1 ${theme.text}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                {t.joinGame}
              </motion.h1>
              <motion.p className={`text-sm ${theme.textMuted}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                {t.chooseColor}
              </motion.p>
            </div>

            <ColorPicker selected={selectedColor} onChange={setSelectedColor} takenColors={takenColors} />

            {selectedColor && (
              <motion.div className="flex justify-center items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-5 h-5 rounded-full shadow border-2 border-white/30"
                  style={{ backgroundColor: COLOR_THEMES[selectedColor]?.swatch }} />
                <span className={`text-xs ${theme.textMuted}`}>{COLOR_THEMES[selectedColor]?.label["en"]}</span>
              </motion.div>
            )}

            <motion.input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder={t.namePlaceholder}
              maxLength={20}
              autoFocus
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`w-full px-5 py-4 rounded-2xl border text-lg font-semibold outline-none transition-all
                bg-white/5 ${theme.border} ${theme.text} placeholder:opacity-30
                focus:ring-2 ${theme.ring} focus:border-transparent`}
            />

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
                {error}
              </motion.p>
            )}

            <Btn size="lg" fullWidth loading={loading} disabled={!name.trim() || !selectedColor} onClick={handleJoin}>
              {t.join}
            </Btn>
          </motion.div>
        )}

      </AnimatePresence>
    </PageShell>
  );
}
