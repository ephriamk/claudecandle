import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS, GRADIENT } from "../lib/theme";
import { INTER } from "../lib/fonts";
import { GradientText } from "../components/GradientText";
import { GlowOrb } from "../components/GlowOrb";
import { SMOOTH, SNAPPY } from "../lib/animations";

const BENEFITS = [
  { icon: "⚡", title: "Instant Trading", desc: "Live on Jupiter the moment you launch" },
  { icon: "💧", title: "Real Liquidity", desc: "CPMM pool paired with SOL" },
  { icon: "🔒", title: "Mint Revoked", desc: "Fixed supply, no rug risk" },
  { icon: "🌐", title: "Full Ecosystem", desc: "Jupiter, Birdeye, DexScreener" },
];

export const RaydiumSpotlight: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, delay: 5, config: SMOOTH });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

  const tagSpring = spring({ frame, fps, delay: 15, config: SMOOTH });
  const tagOpacity = interpolate(tagSpring, [0, 1], [0, 1]);

  // Jupiter badge animation
  const jupSpring = spring({ frame, fps, delay: 80, config: SNAPPY });
  const jupScale = interpolate(jupSpring, [0, 1], [0.5, 1]);
  const jupOpacity = interpolate(jupSpring, [0, 1], [0, 1]);

  // Pulse on Jupiter badge
  const jupPulse = interpolate(
    Math.sin(((frame - 80) / 25) * Math.PI * 2),
    [-1, 1],
    [0.4, 1]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: INTER,
        padding: 80,
        flexDirection: "column",
      }}
    >
      <GlowOrb color={COLORS.cyan} size={600} x={1200} y={100} />
      <GlowOrb color={COLORS.purple} size={500} x={-100} y={400} pulseSpeed={75} />

      {/* Top section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 50,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div style={{
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.cyan,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            Recommended
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1 }}>
            <GradientText gradient={GRADIENT.cool}>Raydium</GradientText>
            <br />
            <span style={{ color: COLORS.white, fontSize: 56 }}>CPMM Launch</span>
          </div>
          <div style={{ opacity: tagOpacity, fontSize: 24, color: COLORS.gray, marginTop: 16, maxWidth: 550 }}>
            Create a token and open a Raydium pool in one transaction. Instantly tradeable on Jupiter.
          </div>
        </div>

        {/* Jupiter live badge */}
        <div
          style={{
            opacity: jupOpacity,
            transform: `scale(${jupScale})`,
            padding: "24px 36px",
            borderRadius: 20,
            background: `${COLORS.bgCard}ee`,
            border: `2px solid ${COLORS.cyan}50`,
            boxShadow: `0 0 ${40 * jupPulse}px ${COLORS.cyan}40`,
            textAlign: "center",
            marginTop: 30,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>🪐</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.cyan }}>Jupiter Ready</div>
          <div style={{ fontSize: 14, color: COLORS.gray, marginTop: 4 }}>Instant trading</div>
        </div>
      </div>

      {/* Benefits grid */}
      <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
        {BENEFITS.map((benefit, i) => {
          const bSpring = spring({ frame, fps, delay: 30 + i * 10, config: SMOOTH });
          const bOpacity = interpolate(bSpring, [0, 1], [0, 1]);
          const bY = interpolate(bSpring, [0, 1], [40, 0]);

          return (
            <div
              key={benefit.title}
              style={{
                opacity: bOpacity,
                transform: `translateY(${bY}px)`,
                flex: 1,
                padding: "32px 24px",
                borderRadius: 16,
                background: `${COLORS.bgCard}cc`,
                border: `1px solid ${COLORS.cyan}15`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{benefit.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>
                {benefit.title}
              </div>
              <div style={{ fontSize: 15, color: COLORS.gray, lineHeight: 1.4 }}>
                {benefit.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom code */}
      <div style={{ marginTop: "auto" }}>
        {(() => {
          const codeSpring = spring({ frame, fps, delay: 70, config: SMOOTH });
          const codeOpacity = interpolate(codeSpring, [0, 1], [0, 1]);
          return (
            <div
              style={{
                opacity: codeOpacity,
                fontFamily: "'Courier New', monospace",
                fontSize: 16,
                color: COLORS.cyan,
                background: "#0d0d15",
                padding: "16px 28px",
                borderRadius: 12,
                border: `1px solid ${COLORS.cyan}20`,
                textAlign: "center",
              }}
            >
              <span style={{ color: COLORS.gray }}>$ </span>
              {`npx tsx scripts/raydium-launch.ts '{"name":"Moon","symbol":"MOON","liquiditySol":5}'`}
            </div>
          );
        })()}
      </div>
    </AbsoluteFill>
  );
};
