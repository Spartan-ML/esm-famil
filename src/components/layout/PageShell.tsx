"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { WaveBackground } from "./WaveBackground";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/locale-context";

interface PageShellProps {
  children: React.ReactNode;
  showBack?: boolean;
  backHref?: string;
  centered?: boolean;
}

export function PageShell({
  children,
  showBack = false,
  backHref = "/",
  centered = true,
}: PageShellProps) {
  const { theme } = useTheme();
  const { isRTL } = useLocale();
  const router = useRouter();

  return (
    <main
      className={`relative min-h-screen flex flex-col overflow-hidden ${theme.text} ${
        centered ? "items-center justify-center" : "items-stretch"
      }`}
    >
      <WaveBackground />

      {/* Language toggle — always top-right (flipped in RTL) */}
      <motion.div
        className={`fixed top-4 z-50 ${isRTL ? "left-4" : "right-4"}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <LanguageToggle size="small" />
      </motion.div>

      {/* Back button */}
      {showBack && (
        <motion.button
          className={`fixed top-4 z-50 ${isRTL ? "right-4" : "left-4"} p-2 rounded-xl ${theme.bgMuted} ${theme.textMuted} ${theme.border} border backdrop-blur-sm`}
          initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push(backHref)}
        >
          {isRTL ? "→" : "←"}
        </motion.button>
      )}

      {centered ? (
        <div className="w-full max-w-md px-5 py-20">{children}</div>
      ) : (
        <div className="w-full pt-16 pb-10 px-5">{children}</div>
      )}
    </main>
  );
}
