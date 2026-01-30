import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
} from "remotion";
import { COLORS, GRADIENT } from "../lib/theme";
import { INTER } from "../lib/fonts";
import { GradientText } from "../components/GradientText";
import { GlowOrb } from "../components/GlowOrb";
import { SMOOTH } from "../lib/animations";

const PLATFORMS = [
  { name: "Raydium CPMM", desc: "Instant Jupiter trading", color: COLORS.cyan, accent: GRADIENT.cool },
  { name: "Pump.fun", desc: "73% market share", color: COLORS.green, accent: GRADIENT.solana },
  { name: "Meteora DBC", desc: "Powers Believe & Bags", color: COLORS.orange, accent: GRADIENT.fire },
  { name: "LaunchLab", desc: "Raydium bonding curve", color: COLORS.purple, accent: GRADIENT.cool },
  { name: "auto.fun", desc: "Auto-graduating curve", color: COLORS.yellow, accent: GRADIENT.gold },
];

const PlatformCard: React.FC<{ platform: typeof PLATFORMS[0]; index: number }> = ({
  platform,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, delay: index * 6, config: SMOOTH });
  const translateX = interpolate(enter, [0, 1], [80, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  const shimmer = interpolate(
    Math.sin(((frame + index * 20) / 50) * Math.PI * 2),
    [-1, 1],
    [0, 0.15]
  );

  return (
    <div
      style={{
        transform: `translateX(${translateX}px)`,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "24px 36px",
        borderRadius: 16,
        border: `1px solid ${platform.color}30`,
        background: `${COLORS.bgCard}cc`,
        backdropFilter: "blur(10px)",
        boxShadow: `0 0 ${30 + shimmer * 100}px ${platform.color}${Math.round(shimmer * 255).toString(16).padStart(2, "0")}`,
        width: 420,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: platform.accent,
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.white }}>
          {platform.name}
        </div>
        <div style={{ fontSize: 16, color: COLORS.gray, marginTop: 4 }}>
          {platform.desc}
        </div>
      </div>
    </div>
  );
};

export const Platforms: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingSpring = spring({ frame, fps, config: SMOOTH });
  const headingOpacity = interpolate(headingSpring, [0, 1], [0, 1]);
  const headingY = interpolate(headingSpring, [0, 1], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: INTER,
        padding: 80,
      }}
    >
      <GlowOrb color={COLORS.purple} size={400} x={-100} y={300} />
      <GlowOrb color={COLORS.green} size={350} x={1400} y={200} pulseSpeed={70} />

      {/* Left side: heading */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 0,
          bottom: 0,
          width: "50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transform: `translateY(${headingY}px)`,
          opacity: headingOpacity,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.green,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          5 Launch Platforms
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1 }}>
          <GradientText gradient={GRADIENT.solana}>One Tool.</GradientText>
          <br />
          <span style={{ color: COLORS.white }}>Every Launchpad.</span>
        </div>
        <div style={{ fontSize: 20, color: COLORS.gray, marginTop: 24, maxWidth: 450 }}>
          Launch meme coins across all major Solana platforms from a single CLI or Claude Desktop.
        </div>
      </div>

      {/* Right side: cards */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 16,
        }}
      >
        {PLATFORMS.map((platform, i) => (
          <Sequence from={0} key={platform.name}>
            <PlatformCard platform={platform} index={i} />
          </Sequence>
        ))}
      </div>
    </AbsoluteFill>
  );
};
