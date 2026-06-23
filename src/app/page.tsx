"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { useTheme } from "@/lib/theme-context";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { WaveBackground } from "@/components/layout/WaveBackground";

type HomePhase = "language" | "menu";

export default function HomePage() {
  const { locale, t } = useLocale();
  const { theme } = useTheme();
  const router = useRouter();

  const [phase, setPhase] = useState<HomePhase>("language");
  const [langSelected, setLangSelected] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("esm-famil-locale");
    if (saved === "en" || saved === "fa") {
      setPhase("menu");
      setLangSelected(true);
    }
  }, []);

  useEffect(() => {
    if (!langSelected) return;
    const timer = setTimeout(() => setPhase("menu"), 600);
    return () => clearTimeout(timer);
  }, [langSelected]);

  return (
    <main className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden ${theme.text}`}>
      <WaveBackground />

      <AnimatePresence mode="wait">
        {phase === "language" ? (
          <motion.div
            key="lang-center"
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p
              className={`text-xl font-medium ${theme.textMuted}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {t.selectLanguage}
            </motion.p>

            <div onClick={() => setLangSelected(true)}>
              <LanguageToggle size="large" />
            </div>

            <motion.div
              className={`text-sm ${theme.textMuted} flex items-center gap-2`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ delay: 1.5, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <span>↑</span>
              <span>{locale === "fa" ? "یکی را انتخاب کنید" : "Pick one to continue"}</span>
              <span>↑</span>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            className="flex flex-col items-center w-full max-w-sm px-6 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.div
              className="fixed top-5 right-5 z-50"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <LanguageToggle size="small" />
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className={`text-5xl font-black tracking-tight mb-2 ${theme.text}`}>
                {locale === "fa" ? "اسم فامیل" : "Esm Famil"}
              </h1>
              <p className={`text-base ${theme.textMuted}`}>{t.tagline}</p>
            </motion.div>

            <motion.div
              className="flex flex-col gap-4 w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/create")}
                className={`w-full py-5 rounded-2xl text-xl font-bold shadow-lg ${theme.button} ${theme.buttonHover} transition-colors`}
              >
                {t.createGame}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/join")}
                className={`w-full py-5 rounded-2xl text-xl font-bold shadow-lg border-2 ${theme.border} ${theme.bgMuted} ${theme.text} hover:opacity-90 transition-opacity backdrop-blur-sm`}
              >
                {t.joinGame}
              </motion.button>
            </motion.div>

            <motion.div
              className="flex gap-2 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.8 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${theme.bgStrong}`}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
