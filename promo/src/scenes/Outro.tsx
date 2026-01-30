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
import { SMOOTH, SNAPPY, BOUNCY } from "../lib/animations";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Candle icon
  const iconScale = spring({ frame, fps, delay: 5, config: BOUNCY });

  // Title
  const titleSpring = spring({ frame, fps, delay: 12, config: SMOOTH });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

  // CTA
  const ctaSpring = spring({ frame, fps, delay: 25, config: SNAPPY });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0.8, 1]);
  const ctaOpacity = interpolate(ctaSpring, [0, 1], [0, 1]);

  // URL
  const urlSpring = spring({ frame, fps, delay: 35, config: SMOOTH });
  const urlOpacity = interpolate(urlSpring, [0, 1], [0, 1]);

  // Tagline
  const tagSpring = spring({ frame, fps, delay: 45, config: SMOOTH });
  const tagOpacity = interpolate(tagSpring, [0, 1], [0, 1]);

  // Pulsing border on CTA
  const pulse = interpolate(
    Math.sin((frame / 30) * Math.PI * 2),
    [-1, 1],
    [0.3, 0.8]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: INTER,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <GlowOrb color={COLORS.purple} size={700} x={500} y={200} pulseSpeed={60} />
      <GlowOrb color={COLORS.green} size={600} x={1000} y={400} pulseSpeed={80} />
      <GlowOrb color={COLORS.cyan} size={400} x={300} y={600} pulseSpeed={100} />

      {/* Icon */}
      <div
        style={{
          transform: `scale(${iconScale})`,
          fontSize: 72,
          marginBottom: 24,
        }}
      >
        🕯️
      </div>

      {/* Title */}
      <div
        style={{
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          fontSize: 80,
          fontWeight: 900,
          letterSpacing: -2,
          marginBottom: 32,
        }}
      >
        <GradientText gradient={GRADIENT.solana}>ClaudeCandle</GradientText>
      </div>

      {/* CTA Button */}
      <div
        style={{
          transform: `scale(${ctaScale})`,
          opacity: ctaOpacity,
          padding: "20px 60px",
          borderRadius: 16,
          background: GRADIENT.solana,
          fontSize: 28,
          fontWeight: 700,
          color: COLORS.white,
          boxShadow: `0 0 40px ${COLORS.purple}${Math.round(pulse * 255).toString(16).padStart(2, "0")}`,
          marginBottom: 28,
        }}
      >
        Start Launching Today
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          fontFamily: "'Courier New', monospace",
          fontSize: 22,
          color: COLORS.green,
          padding: "12px 28px",
          background: `${COLORS.bgCard}cc`,
          borderRadius: 10,
          border: `1px solid ${COLORS.green}30`,
          marginBottom: 20,
        }}
      >
        npm install claudecandle
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: tagOpacity,
          fontSize: 18,
          color: COLORS.gray,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        CLI &bull; MCP Server &bull; Claude Desktop &bull; Open Source
      </div>
    </AbsoluteFill>
  );
};
