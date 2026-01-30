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

const PLATFORMS = [
  {
    name: "Raydium CPMM",
    tag: "Instant Jupiter",
    color: COLORS.cyan,
    gradient: GRADIENT.cool,
    detail: "~0.3 SOL + liquidity",
  },
  {
    name: "Pump.fun",
    tag: "73% Market Share",
    color: COLORS.green,
    gradient: GRADIENT.solana,
    detail: "Free to create",
  },
  {
    name: "Meteora DBC",
    tag: "Believe & Bags",
    color: COLORS.orange,
    gradient: GRADIENT.fire,
    detail: "Dynamic bonding curve",
  },
  {
    name: "LaunchLab",
    tag: "Raydium Curve",
    color: COLORS.purple,
    gradient: GRADIENT.cool,
    detail: "Graduates to CPMM",
  },
  {
    name: "auto.fun",
    tag: "Auto Graduate",
    color: COLORS.yellow,
    gradient: GRADIENT.gold,
    detail: "Buy/sell on-curve",
  },
];

export const FivePlatforms: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleSpring = spring({ frame, fps, config: SMOOTH });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleScale = interpolate(titleSpring, [0, 1], [0.9, 1]);

  // Big number
  const numSpring = spring({ frame, fps, delay: 10, config: SNAPPY });
  const numScale = interpolate(numSpring, [0, 1], [0.3, 1]);

  // Subtitle
  const subSpring = spring({ frame, fps, delay: 20, config: SMOOTH });
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: INTER,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      <GlowOrb color={COLORS.purple} size={500} x={800} y={-100} />
      <GlowOrb color={COLORS.green} size={400} x={200} y={800} pulseSpeed={80} />

      {/* Big number */}
      <div
        style={{
          transform: `scale(${numScale})`,
          fontSize: 140,
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        <GradientText gradient={GRADIENT.solana}>5</GradientText>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          fontSize: 44,
          fontWeight: 900,
          color: COLORS.white,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Platforms. One CLI.
      </div>

      <div
        style={{
          opacity: subOpacity,
          fontSize: 20,
          color: COLORS.gray,
          marginBottom: 48,
          textAlign: "center",
        }}
      >
        Every major Solana launchpad, unified.
      </div>

      {/* Platform cards — horizontal row */}
      <div style={{ display: "flex", gap: 16, width: "100%" }}>
        {PLATFORMS.map((p, i) => {
          const cardSpring = spring({ frame, fps, delay: 30 + i * 10, config: SMOOTH });
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const cardY = interpolate(cardSpring, [0, 1], [50, 0]);

          const shimmer = interpolate(
            Math.sin(((frame + i * 25) / 40) * Math.PI * 2),
            [-1, 1],
            [0.15, 0.4]
          );

          return (
            <div
              key={p.name}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                flex: 1,
                padding: "28px 20px",
                borderRadius: 16,
                background: `${COLORS.bgCard}dd`,
                border: `1px solid ${p.color}30`,
                textAlign: "center",
                boxShadow: `0 0 ${20 + shimmer * 40}px ${p.color}${Math.round(shimmer * 100).toString(16).padStart(2, "0")}`,
              }}
            >
              {/* Color dot */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: p.gradient,
                  margin: "0 auto 16px",
                }}
              />
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.white, marginBottom: 6 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: p.color, marginBottom: 8 }}>
                {p.tag}
              </div>
              <div style={{ fontSize: 12, color: COLORS.gray }}>
                {p.detail}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
