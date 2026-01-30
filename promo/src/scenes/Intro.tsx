import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, GRADIENT } from "../lib/theme";
import { INTER } from "../lib/fonts";
import { GradientText } from "../components/GradientText";
import { GlowOrb } from "../components/GlowOrb";
import { SMOOTH, SNAPPY } from "../lib/animations";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Candle icon scale-in
  const iconScale = spring({ frame, fps, delay: 5, config: SNAPPY });
  const iconRotate = interpolate(iconScale, [0, 1], [-20, 0]);

  // Title slide up
  const titleSpring = spring({ frame, fps, delay: 15, config: SMOOTH });
  const titleY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  // Tagline
  const tagSpring = spring({ frame, fps, delay: 30, config: SMOOTH });
  const tagY = interpolate(tagSpring, [0, 1], [30, 0]);
  const tagOpacity = interpolate(tagSpring, [0, 1], [0, 1]);

  // Subtitle
  const subSpring = spring({ frame, fps, delay: 45, config: SMOOTH });
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  // Glow pulse behind icon
  const glowSize = interpolate(
    Math.sin((frame / 40) * Math.PI * 2),
    [-1, 1],
    [180, 220]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: INTER,
      }}
    >
      <GlowOrb color={COLORS.purple} size={600} x={200} y={100} />
      <GlowOrb color={COLORS.green} size={500} x={1200} y={500} pulseSpeed={80} />

      {/* Candle Icon */}
      <div
        style={{
          transform: `scale(${iconScale}) rotate(${iconRotate}deg)`,
          fontSize: 90,
          marginBottom: 20,
          filter: `drop-shadow(0 0 ${glowSize / 5}px ${COLORS.purple}80)`,
        }}
      >
        🕯️
      </div>

      {/* Title */}
      <div
        style={{
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: -2,
          lineHeight: 1,
          marginBottom: 24,
        }}
      >
        <GradientText gradient={GRADIENT.solana}>ClaudeCandle</GradientText>
      </div>

      {/* Tagline */}
      <div
        style={{
          transform: `translateY(${tagY}px)`,
          opacity: tagOpacity,
          fontSize: 36,
          fontWeight: 600,
          color: COLORS.dimWhite,
          marginBottom: 16,
        }}
      >
        Launch Meme Coins on Solana with AI
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subOpacity,
          fontSize: 22,
          color: COLORS.gray,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        Powered by Claude + MCP
      </div>
    </AbsoluteFill>
  );
};
