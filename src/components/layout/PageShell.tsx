"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { WaveBackground } from "./WaveBackground";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useTheme } from "@/lib/theme-context";

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
  const router = useRouter();

  return (
    <main
      className={`relative min-h-screen w-full flex flex-col items-center overflow-hidden ${theme.text} ${
        centered ? "justify-center" : ""
      }`}
    >
      <WaveBackground />

      {/* Language toggle — fixed top-right, never moves regardless of dir */}
      <div className="fixed top-4 right-4 z-50" style={{ insetInlineEnd: "unset", right: "1rem" }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LanguageToggle size="small" />
        </motion.div>
      </div>

      {/* Back button — fixed top-left, arrow always points ← */}
      {showBack && (
        <div className="fixed top-4 left-4 z-50" style={{ insetInlineStart: "unset", left: "1rem" }}>
          <motion.button
            className={`w-10 h-10 flex items-center justify-center rounded-xl
              ${theme.bgMuted} ${theme.textMuted} border ${theme.border} backdrop-blur-sm
              hover:opacity-80 transition-opacity`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(backHref)}
            aria-label="Back"
          >
            {/* Always ← regardless of RTL */}
            <span style={{ display: "inline-block", direction: "ltr" }}>←</span>
          </motion.button>
        </div>
      )}

      {centered ? (
        <div className="w-full max-w-md px-5 py-20">{children}</div>
      ) : (
        <div className="w-full max-w-lg px-5 pt-20 pb-10">{children}</div>
      )}
    </main>
  );
}
