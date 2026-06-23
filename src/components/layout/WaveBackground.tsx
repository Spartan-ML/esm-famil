"use client";

import { useTheme } from "@/lib/theme-context";

export function WaveBackground() {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base background */}
      <div className={`absolute inset-0 ${theme.bg}`} />

      {/* Wave layers */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        style={{ height: "60vh" }}
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill={theme.wave3}
          fillOpacity="0.6"
          style={{
            animation: "wave1 18s ease-in-out infinite",
          }}
          d="M0,200 C360,280 720,120 1080,200 C1260,240 1380,180 1440,160 L1440,400 L0,400 Z"
        />
        <path
          fill={theme.wave2}
          fillOpacity="0.5"
          style={{
            animation: "wave2 14s ease-in-out infinite",
          }}
          d="M0,240 C300,160 600,320 900,240 C1100,190 1300,260 1440,220 L1440,400 L0,400 Z"
        />
        <path
          fill={theme.wave1}
          fillOpacity="0.8"
          style={{
            animation: "wave3 20s ease-in-out infinite",
          }}
          d="M0,300 C200,260 500,340 800,300 C1000,270 1250,320 1440,290 L1440,400 L0,400 Z"
        />
      </svg>

      {/* Subtle radial glow at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ backgroundColor: theme.wave3 }}
      />

      <style>{`
        @keyframes wave1 {
          0%, 100% { d: path("M0,200 C360,280 720,120 1080,200 C1260,240 1380,180 1440,160 L1440,400 L0,400 Z"); }
          50% { d: path("M0,220 C300,140 700,300 1050,210 C1250,170 1380,230 1440,200 L1440,400 L0,400 Z"); }
        }
        @keyframes wave2 {
          0%, 100% { d: path("M0,240 C300,160 600,320 900,240 C1100,190 1300,260 1440,220 L1440,400 L0,400 Z"); }
          50% { d: path("M0,260 C350,320 650,180 950,260 C1150,310 1320,230 1440,250 L1440,400 L0,400 Z"); }
        }
        @keyframes wave3 {
          0%, 100% { d: path("M0,300 C200,260 500,340 800,300 C1000,270 1250,320 1440,290 L1440,400 L0,400 Z"); }
          50% { d: path("M0,320 C250,350 550,280 850,320 C1050,345 1280,300 1440,310 L1440,400 L0,400 Z"); }
        }
      `}</style>
    </div>
  );
}
