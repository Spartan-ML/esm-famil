"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
import { ColorTheme } from "@/lib/colors";

type BtnVariant = "primary" | "outline" | "ghost" | "danger";
type BtnSize   = "sm" | "md" | "lg" | "xl";

interface BtnProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  fullWidth?: boolean;
  /** Override with a specific theme (e.g. another player's color) */
  themeOverride?: ColorTheme;
}

const sizeClasses: Record<BtnSize, string> = {
  sm: "px-5  py-2    text-sm  font-semibold rounded-xl  gap-1.5",
  md: "px-8  py-3    text-sm  font-bold     rounded-2xl gap-2",
  lg: "px-10 py-4    text-base font-bold    rounded-2xl gap-2",
  xl: "px-12 py-[18px] text-lg font-black  rounded-2xl gap-2.5",
};

export function Btn({
  children,
  variant = "primary",
  size = "lg",
  loading = false,
  fullWidth = false,
  themeOverride,
  disabled,
  className = "",
  ...rest
}: BtnProps) {
  const { theme: ctxTheme } = useTheme();
  const theme = themeOverride ?? ctxTheme;

  const isDisabled = disabled || loading;

  const variantClasses: Record<BtnVariant, string> = {
    primary: `${theme.button} ${theme.buttonHover} shadow-lg`,
    outline: `border-2 ${theme.border} ${theme.bgMuted} ${theme.text} hover:opacity-90 backdrop-blur-sm`,
    ghost:   `${theme.text} hover:opacity-70`,
    danger:  "bg-rose-600 text-white hover:bg-rose-500 shadow-lg",
  };

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.025 } : {}}
      whileTap={!isDisabled   ? { scale: 0.965 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={isDisabled}
      className={[
        /* Layout */
        "relative inline-flex items-center justify-center",
        "text-center select-none",
        /* Sizing */
        sizeClasses[size],
        /* Variant */
        variantClasses[variant],
        /* Width */
        fullWidth ? "w-full" : "",
        /* Disabled */
        isDisabled
          ? "opacity-40 cursor-not-allowed pointer-events-none"
          : "cursor-pointer transition-colors duration-150",
        /* Caller extras */
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full shrink-0"
          aria-hidden
        />
      )}
      {children}
    </motion.button>
  );
}
