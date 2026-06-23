"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Locale } from "@/types";
import { en, fa, Translations } from "@/locales";

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
  t: en,
  isRTL: false,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("esm-famil-locale") as Locale | null;
    if (saved === "fa" || saved === "en") setLocaleState(saved);
    setMounted(true);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("esm-famil-locale", l);
    document.documentElement.dir = l === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  };

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  const t = locale === "fa" ? fa : en;

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t, isRTL: locale === "fa" }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
