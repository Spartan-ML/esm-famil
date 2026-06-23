"use client";

import { motion } from "framer-motion";
import { Player } from "@/types";
import { COLOR_THEMES, DEFAULT_THEME } from "@/lib/colors";
import { PlayerColor } from "@/types";

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer?: boolean;
  score?: number;
  index?: number;
}

export function PlayerCard({
  player,
  isCurrentPlayer = false,
  score,
  index = 0,
}: PlayerCardProps) {
  const theme = COLOR_THEMES[player.color as PlayerColor] ?? DEFAULT_THEME;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 260, damping: 22 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${theme.bgMuted} ${theme.border} backdrop-blur-sm`}
    >
      {/* Color dot */}
      <div
        className="w-4 h-4 rounded-full flex-shrink-0 shadow"
        style={{ backgroundColor: theme.swatch }}
      />

      {/* Name */}
      <span className={`flex-1 font-semibold text-sm ${theme.text}`}>
        {player.name}
        {isCurrentPlayer && (
          <span className={`ml-2 text-xs font-normal ${theme.textMuted}`}>(you)</span>
        )}
      </span>

      {/* Host badge */}
      {player.is_host && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${theme.bgStrong} ${theme.textOnStrong} font-medium`}>
          Host
        </span>
      )}

      {/* Score (shown on scoreboard) */}
      {score !== undefined && (
        <span className={`text-sm font-bold ${theme.text}`}>{score}</span>
      )}
    </motion.div>
  );
}
