"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Btn } from "@/components/ui/Btn";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/locale-context";
import { PlayerColor } from "@/types";
import { generateUniqueCode, createRoom, createPlayer, updateRoom } from "@/lib/rooms";
import { saveSession } from "@/lib/session";
import { COLOR_THEMES } from "@/lib/colors";

type Step = "color" | "name";

export default function CreatePage() {
  const { theme, setColor } = useTheme();
  const { t } = useLocale();
  const router = useRouter();

  const [step, setStep]                   = useState<Step>("color");
  const [selectedColor, setSelectedColor] = useState<PlayerColor | null>(null);
  const [name, setName]                   = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

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
      const { player, token } = await createPlayer({ roomId: room.id, name: name.trim(), color: selectedColor, isHost: true });
      await updateRoom(room.id, { host_id: player.id });
      saveSession({ token, playerId: player.id, roomCode: code, expiresAt: player.token_expires_at });
      router.push(`/room/${code}`);
    } catch {
      setError(t.errorGeneric);
      setLoading(false);
    }
  };

  const slide = { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 } };

  return (
    <PageShell showBack centered>
      <AnimatePresence mode="wait">

        {/* ── Step 1: Color ── */}
        {step === "color" && (
          <motion.div key="color-step" {...slide} transition={{ duration: 0.3 }} className="flex flex-col gap-6">
            <div className="text-center">
              <motion.h1 className={`text-2xl font-black mb-1 ${theme.text}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                {t.createGame}
              </motion.h1>
              <motion.p className={`text-sm ${theme.textMuted}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                {t.chooseColor}
              </motion.p>
            </div>

            <ColorPicker selected={selectedColor} onChange={setSelectedColor} />

            <Btn size="lg" fullWidth disabled={!selectedColor} onClick={handleColorNext}>
              {t.enterName} →
            </Btn>
          </motion.div>
        )}

        {/* ── Step 2: Name ── */}
        {step === "name" && (
          <motion.div key="name-step" {...slide} transition={{ duration: 0.3 }} className="flex flex-col gap-6">
            <div className="text-center">
              <motion.h1 className={`text-2xl font-black mb-1 ${theme.text}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                {t.enterName}
              </motion.h1>
              <motion.p className={`text-sm ${theme.textMuted}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                {t.namePlaceholder}
              </motion.p>
            </div>

            {/* Color swatch — click to go back */}
            <motion.div className="flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <button onClick={() => setStep("color")} className="flex items-center gap-2 group">
                <div
                  className="w-6 h-6 rounded-full shadow border-2 border-white/30 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: selectedColor ? COLOR_THEMES[selectedColor]?.swatch : "#888" }}
                />
                <span className={`text-xs underline underline-offset-2 ${theme.textMuted}`}>{t.chooseColor}</span>
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`w-full px-5 py-4 rounded-2xl border text-lg font-semibold outline-none transition-all
                bg-white/5 ${theme.border} ${theme.text} placeholder:opacity-30
                focus:ring-2 ${theme.ring} focus:border-transparent`}
            />

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
                {error}
              </motion.p>
            )}

            <Btn size="lg" fullWidth loading={loading} disabled={!name.trim()} onClick={handleCreate}>
              {t.createGame}
            </Btn>
          </motion.div>
        )}

      </AnimatePresence>
    </PageShell>
  );
}
