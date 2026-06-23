"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { PlayerColor } from "@/types";
import { COLOR_THEMES, ColorTheme, DEFAULT_THEME } from "@/lib/colors";

interface ThemeContextType {
  color: PlayerColor | null;
  theme: ColorTheme;
  setColor: (c: PlayerColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  color: null,
  theme: DEFAULT_THEME,
  setColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [color, setColorState] = useState<PlayerColor | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("esm-famil-color") as PlayerColor | null;
    if (saved && COLOR_THEMES[saved]) setColorState(saved);
  }, []);

  const setColor = (c: PlayerColor) => {
    setColorState(c);
    localStorage.setItem("esm-famil-color", c);
  };

  const theme = color ? COLOR_THEMES[color] : DEFAULT_THEME;

  return (
    <ThemeContext.Provider value={{ color, theme, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
