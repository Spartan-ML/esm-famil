"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/locale-context";
import { PlayerColor } from "@/types";
import { generateUniqueCode, createRoom, createPlayer } from "@/lib/rooms";
import { saveSession } from "@/lib/session";
import { updateRoom } from "@/lib/rooms";
import { COLOR_THEMES } from "@/lib/colors";

type Step = "color" | "name";

export default function CreatePage() {
  const { theme, setColor } = useTheme();
  const { t, isRTL } = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<Step>("color");
  const [selectedColor, setSelectedColor] = useState<PlayerColor | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleColorNext = () => {
    if (!selectedColor) return;
    setColor(selectedColor);
    setStep("name");
  };

  const handleCreate = async () => {
    if (!name.trim() || !selectedColor) return;
    setLoading(true);
    setError(null);

    try {
      const code = await generateUniqueCode();
      const room = await createRoom(code);
      const { player, token } = await createPlayer({
        roomId: room.id,
        name: name.trim(),
        color: selectedColor,
        isHost: true,
      });
      await updateRoom(room.id, { host_id: player.id });

      saveSession({
        token,
        playerId: player.id,
        roomCode: code,
        expiresAt: player.token_expires_at,
      });

      router.push(`/room/${code}`);
    } catch (e) {
      setError(t.errorGeneric);
      setLoading(false);
    }
  };

  return (
    <PageShell showBack centered>
      <AnimatePresence mode="wait">

        {/* ── Step 1: Color ── */}
        {step === "color" && (
          <motion.div
            key="color-step"
            initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-6"
          >
            <div>
              <motion.h1
                className={`text-2xl font-black mb-1 ${theme.text}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {t.createGame}
              </motion.h1>
              <motion.p
                className={`text-sm ${theme.textMuted}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {t.chooseColor}
              </motion.p>
            </div>

            <ColorPicker selected={selectedColor} onChange={setSelectedColor} />

            <motion.button
              whileHover={selectedColor ? { scale: 1.02 } : {}}
              whileTap={selectedColor ? { scale: 0.97 } : {}}
              onClick={handleColorNext}
              disabled={!selectedColor}
              className={`w-full py-4 rounded-2xl text-base font-bold transition-all
                ${selectedColor
                  ? `${theme.button} ${theme.buttonHover}`
                  : `${theme.bgMuted} ${theme.textMuted} opacity-50 cursor-not-allowed`
                }`}
            >
              {t.enterName} →
            </motion.button>
          </motion.div>
        )}

        {/* ── Step 2: Name ── */}
        {step === "name" && (
          <motion.div
            key="name-step"
            initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-6"
          >
            <div>
              <motion.h1
                className={`text-2xl font-black mb-1 ${theme.text}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {t.enterName}
              </motion.h1>
              <motion.p
                className={`text-sm ${theme.textMuted}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {t.createGame}
              </motion.p>
            </div>

            {/* Color preview */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <button
                onClick={() => setStep("color")}
                className="flex items-center gap-2 group"
              >
                <div
                  className="w-6 h-6 rounded-full shadow border-2 border-white/30 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: selectedColor ? COLOR_THEMES[selectedColor]?.swatch : "#888" }}
                />
                <span className={`text-xs underline underline-offset-2 ${theme.textMuted}`}>
                  {t.chooseColor}
                </span>
              </button>
            </motion.div>

            <motion.input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder={t.namePlaceholder}
              maxLength={20}
              autoFocus
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`w-full px-4 py-4 rounded-2xl border text-lg font-semibold outline-none transition-all
                bg-white/5 ${theme.border} ${theme.text} placeholder:${theme.textMuted}
                focus:ring-2 ${theme.ring} focus:border-transparent`}
            />

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              whileHover={name.trim() ? { scale: 1.02 } : {}}
              whileTap={name.trim() ? { scale: 0.97 } : {}}
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`w-full py-4 rounded-2xl text-base font-bold transition-all
                ${name.trim() && !loading
                  ? `${theme.button} ${theme.buttonHover}`
                  : `${theme.bgMuted} ${theme.textMuted} opacity-50 cursor-not-allowed`
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                  />
                  {t.joining}
                </span>
              ) : (
                t.createGame
              )}
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </PageShell>
  );
}
