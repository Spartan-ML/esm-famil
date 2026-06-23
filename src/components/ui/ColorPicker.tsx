"use client";

import { motion } from "framer-motion";
import { PlayerColor } from "@/types";
import { COLOR_THEMES } from "@/lib/colors";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/locale-context";

const COLORS: PlayerColor[] = [
  "blue", "purple", "green", "red",
  "orange", "yellow", "pink", "brown",
];

interface ColorPickerProps {
  selected: PlayerColor | null;
  onChange: (color: PlayerColor) => void;
  takenColors?: PlayerColor[];
}

export function ColorPicker({ selected, onChange, takenColors = [] }: ColorPickerProps) {
  const { theme } = useTheme();
  const { locale } = useLocale();

  return (
    <div className="grid grid-cols-4 gap-3">
      {COLORS.map((color, i) => {
        const ct = COLOR_THEMES[color];
        const isSelected = selected === color;
        const isTaken = takenColors.includes(color);

        return (
          <motion.button
            key={color}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: isTaken ? 0.3 : 1, scale: 1 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 22 }}
            whileHover={isTaken ? {} : { scale: 1.12 }}
            whileTap={isTaken ? {} : { scale: 0.92 }}
            onClick={() => !isTaken && onChange(color)}
            disabled={isTaken}
            title={ct.label[locale]}
            className="relative flex flex-col items-center gap-1.5 group"
          >
            {/* Swatch circle */}
            <div className="relative">
              <motion.div
                className="w-14 h-14 rounded-full shadow-lg"
                style={{ backgroundColor: ct.swatch }}
                animate={isSelected ? { scale: 1.15 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />

              {/* Selected ring */}
              {isSelected && (
                <motion.div
                  layoutId="color-ring"
                  className="absolute -inset-1.5 rounded-full border-2 border-white/70"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Taken indicator */}
              {isTaken && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40">
                  <span className="text-white text-lg">✕</span>
                </div>
              )}

              {/* Check mark on selected */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 }}
                >
                  <span className="text-white text-lg font-bold drop-shadow">✓</span>
                </motion.div>
              )}
            </div>

            {/* Label */}
            <span className={`text-xs font-medium ${isSelected ? theme.text : theme.textMuted}`}>
              {ct.label[locale]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
