"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/locale-context";

const MIN_CATEGORIES = 5;
const MAX_CATEGORIES = 10;
const INITIAL_COUNT = 6;

interface CategoryBuilderProps {
  value: string[];
  onChange: (categories: string[]) => void;
}

export function CategoryBuilder({ value, onChange }: CategoryBuilderProps) {
  const { theme } = useTheme();
  const { t } = useLocale();
  const [fieldCount, setFieldCount] = useState(
    Math.max(INITIAL_COUNT, value.length)
  );

  const handleChange = (index: number, text: string) => {
    const next = [...value];
    next[index] = text;
    onChange(next);
  };

  const addField = () => {
    if (fieldCount >= MAX_CATEGORIES) return;
    setFieldCount((n) => n + 1);
  };

  const filledCount = value.filter((v) => v?.trim()).length;
  const canAdd = fieldCount < MAX_CATEGORIES;

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {Array.from({ length: fieldCount }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pb-0.5">
              {/* Field number */}
              <span className={`text-xs font-mono w-5 text-center flex-shrink-0 ${theme.textMuted}`}>
                {i + 1}
              </span>

              <input
                type="text"
                value={value[i] ?? ""}
                onChange={(e) => handleChange(i, e.target.value)}
                placeholder={t.categoryPlaceholder}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all
                  bg-white/5 ${theme.border} ${theme.text} placeholder:${theme.textMuted}
                  focus:ring-2 ${theme.ring} focus:border-transparent`}
              />

              {/* Clear button */}
              {value[i]?.trim() && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  onClick={() => handleChange(i, "")}
                  className={`flex-shrink-0 text-lg leading-none ${theme.textMuted} hover:opacity-70`}
                >
                  ×
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* + button */}
      <AnimatePresence>
        {canAdd && (
          <motion.button
            key="add-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={addField}
            className={`mt-1 w-full py-2.5 rounded-xl border-dashed border-2 text-sm font-semibold
              ${theme.border} ${theme.textMuted} hover:opacity-70 transition-opacity`}
          >
            + {t.addCategory}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Progress hint */}
      <motion.p
        className={`text-xs text-center mt-1 ${
          filledCount >= MIN_CATEGORIES ? theme.textMuted : "text-amber-400"
        }`}
        animate={{ opacity: 1 }}
      >
        {filledCount < MIN_CATEGORIES
          ? t.minCategories
          : `${filledCount} / ${fieldCount} ${t.categories}`}
      </motion.p>
    </div>
  );
}
