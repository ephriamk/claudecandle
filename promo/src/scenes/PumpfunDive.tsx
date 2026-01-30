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
import { countUp } from "../lib/animations";

const FACTS = [
  { label: "Market Share", value: "73%", icon: "📊" },
  { label: "Graduation Target", value: "~85 SOL", icon: "🎯" },
  { label: "Creation Fee", value: "Free", icon: "💰" },
  { label: "Trading Fee", value: "1%", icon: "⚡" },
];

export const PumpfunDive: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Badge
  const badgeSpring = spring({ frame, fps, delay: 0, config: SNAPPY });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0, 1]);

  // Title
  const titleSpring = spring({ frame, fps, delay: 8, config: SMOOTH });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

  // Big number counter
  const bigNum = countUp(frame, 20, 40, 73);

  // Subtitle
  const subSpring = spring({ frame, fps, delay: 18, config: SMOOTH });
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  // Flow diagram
  const flowSpring = spring({ frame, fps, delay: 65, config: SMOOTH });
  const flowOpacity = interpolate(flowSpring, [0, 1], [0, 1]);
  const flowY = interpolate(flowSpring, [0, 1], [30, 0]);

  // Code
  const codeSpring = spring({ frame, fps, delay: 90, config: SMOOTH });
  const codeOpacity = interpolate(codeSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: INTER,
        padding: 80,
      }}
    >
      <GlowOrb color={COLORS.green} size={600} x={100} y={200} />
      <GlowOrb color={COLORS.purple} size={400} x={1300} y={500} pulseSpeed={80} />

      {/* Left column */}
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
        }}
      >
        {/* Platform badge */}
        <div
          style={{
            transform: `scale(${badgeScale})`,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 20px",
            borderRadius: 30,
            background: `${COLORS.green}15`,
            border: `1px solid ${COLORS.green}40`,
            marginBottom: 24,
            alignSelf: "flex-start",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.green, letterSpacing: 2, textTransform: "uppercase" }}>
            #1 Solana Launchpad
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1 }}>
            <GradientText gradient={GRADIENT.solana}>Pump.fun</GradientText>
          </div>
          <div style={{ fontSize: 28, color: COLORS.dimWhite, marginTop: 12, fontWeight: 600 }}>
            The biggest meme coin launchpad
          </div>
        </div>

        {/* Big market share number */}
        <div style={{ opacity: subOpacity, marginBottom: 32 }}>
          <span style={{ fontSize: 120, fontWeight: 900, color: COLORS.green, lineHeight: 1 }}>
            {bigNum}%
          </span>
          <div style={{ fontSize: 18, color: COLORS.gray, marginTop: 4, textTransform: "uppercase", letterSpacing: 2 }}>
            of all Solana token launches
          </div>
        </div>

        {/* Code snippet */}
        <div
          style={{
            opacity: codeOpacity,
            fontFamily: "'Courier New', monospace",
            fontSize: 15,
            color: COLORS.green,
            background: "#0d0d15",
            padding: "16px 24px",
            borderRadius: 12,
            border: `1px solid ${COLORS.green}20`,
            maxWidth: 600,
          }}
        >
          <span style={{ color: COLORS.gray }}>$ </span>
          npx tsx scripts/pumpfun-launch.ts \<br />
          <span style={{ color: COLORS.gray }}>  </span>
          {`'{"name":"Moon","symbol":"MOON"}'`}
        </div>
      </div>

      {/* Right column — flow + facts */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 0,
          bottom: 0,
          width: "40%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 20,
        }}
      >
        {/* Facts grid */}
        {FACTS.map((fact, i) => {
          const factSpring = spring({ frame, fps, delay: 35 + i * 8, config: SMOOTH });
          const factOpacity = interpolate(factSpring, [0, 1], [0, 1]);
          const factX = interpolate(factSpring, [0, 1], [50, 0]);

          return (
            <div
              key={fact.label}
              style={{
                opacity: factOpacity,
                transform: `translateX(${factX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "20px 28px",
                borderRadius: 14,
                background: `${COLORS.bgCard}cc`,
                border: `1px solid ${COLORS.green}15`,
              }}
            >
              <span style={{ fontSize: 32 }}>{fact.icon}</span>
              <div>
                <div style={{ fontSize: 14, color: COLORS.gray, textTransform: "uppercase", letterSpacing: 1 }}>
                  {fact.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.white }}>
                  {fact.value}
                </div>
              </div>
            </div>
          );
        })}

        {/* Flow diagram */}
        <div
          style={{
            opacity: flowOpacity,
            transform: `translateY(${flowY}px)`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 24px",
            borderRadius: 12,
            background: `${COLORS.bgCard}cc`,
            border: `1px solid ${COLORS.purple}20`,
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.purple }}>Launch</div>
          <div style={{ color: COLORS.gray }}>→</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.orange }}>Bonding Curve</div>
          <div style={{ color: COLORS.gray }}>→</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.green }}>PumpSwap</div>
          <div style={{ color: COLORS.gray }}>→</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.cyan }}>Jupiter</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
