"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { useTheme } from "@/lib/theme-context";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { WaveBackground } from "@/components/layout/WaveBackground";
import { Btn } from "@/components/ui/Btn";

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
    <main className={`relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden ${theme.text}`}>
      <WaveBackground />

      <AnimatePresence mode="wait">

        {/* ── Phase 1: Language selection ── */}
        {phase === "language" && (
          <motion.div
            key="lang-center"
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p
              className={`text-xl font-medium text-center ${theme.textMuted}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {t.selectLanguage}
            </motion.p>

            <div onClick={() => setLangSelected(true)}>
              <LanguageToggle size="large" />
            </div>

            <motion.p
              className={`text-sm text-center ${theme.textMuted}`}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ delay: 1.5, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >
              {locale === "fa" ? "یکی را انتخاب کنید تا ادامه دهید" : "Pick one to continue"}
            </motion.p>
          </motion.div>
        )}

        {/* ── Phase 2: Main menu ── */}
        {phase === "menu" && (
          <motion.div
            key="menu"
            className="flex flex-col items-center w-full max-w-sm px-6 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Small lang toggle — always top-right */}
            <motion.div
              className="fixed top-5 right-5 z-50"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <LanguageToggle size="small" />
            </motion.div>

            {/* Title */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className={`text-5xl font-black tracking-tight mb-2 text-center ${theme.text}`}>
                {locale === "fa" ? "اسم فامیل" : "Esm Famil"}
              </h1>
              <p className={`text-base text-center ${theme.textMuted}`}>{t.tagline}</p>
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              className="flex flex-col gap-4 w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <Btn size="xl" variant="primary" fullWidth onClick={() => router.push("/create")}>
                {t.createGame}
              </Btn>
              <Btn size="xl" variant="outline" fullWidth onClick={() => router.push("/join")}>
                {t.joinGame}
              </Btn>
            </motion.div>

            {/* Decorative dots */}
            <motion.div
              className="flex gap-2"
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
