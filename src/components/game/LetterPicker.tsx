"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/locale-context";

interface LetterPickerProps {
  selected: string;
  onChange: (letter: string) => void;
}

export function LetterPicker({ selected, onChange }: LetterPickerProps) {
  const { theme } = useTheme();
  const { t, locale } = useLocale();

  const letters = t.letters;

  const handleRandom = () => {
    const pick = letters[Math.floor(Math.random() * letters.length)];
    onChange(pick);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Random button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleRandom}
        className={`w-full py-2.5 rounded-xl border text-sm font-bold ${theme.bgStrong} ${theme.textOnStrong} ${theme.buttonHover} transition-colors`}
      >
        🎲 {t.randomLetter}
      </motion.button>

      {/* Letter grid */}
      <div className={`flex flex-wrap gap-1.5 ${locale === "fa" ? "direction-rtl" : ""}`}>
        {letters.map((letter, i) => {
          const isSelected = selected === letter;
          return (
            <motion.button
              key={letter}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.012 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange(letter)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                isSelected
                  ? `${theme.bgStrong} ${theme.textOnStrong} shadow-lg scale-110`
                  : `${theme.bgMuted} ${theme.text} ${theme.border} border hover:opacity-80`
              }`}
            >
              {letter}
            </motion.button>
          );
        })}
      </div>

      {/* Selected display */}
      {selected && (
        <motion.div
          key={selected}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-center text-4xl font-black mt-1 ${theme.text}`}
          style={{ fontFamily: locale === "fa" ? "Tahoma, sans-serif" : "inherit" }}
        >
          {selected}
        </motion.div>
      )}
    </div>
  );
}
