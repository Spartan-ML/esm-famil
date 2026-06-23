"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/lib/locale-context";
import { Locale } from "@/types";
import { useTheme } from "@/lib/theme-context";

interface LanguageToggleProps {
  size?: "large" | "small";
}

export function LanguageToggle({ size = "large" }: LanguageToggleProps) {
  const { locale, setLocale } = useLocale();
  const { theme } = useTheme();

  const isLarge = size === "large";

  return (
    <div
      className={`relative flex items-center rounded-full border ${theme.border} ${theme.bgMuted} backdrop-blur-sm ${
        isLarge ? "p-1.5 gap-1" : "p-1 gap-0.5"
      }`}
    >
      {(["en", "fa"] as Locale[]).map((lang) => {
        const active = locale === lang;
        return (
          <button
            key={lang}
            onClick={() => setLocale(lang)}
            className={`relative rounded-full font-semibold transition-colors duration-200 z-10 ${
              isLarge
                ? "px-6 py-3 text-lg"
                : "px-3 py-1.5 text-sm"
            } ${active ? theme.textOnStrong : theme.textMuted}`}
          >
            {active && (
              <motion.div
                layoutId="lang-pill"
                className={`absolute inset-0 rounded-full ${theme.bgStrong}`}
                style={{ zIndex: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            {lang === "en" ? "English" : "فارسی"}
          </button>
        );
      })}
    </div>
  );
}
