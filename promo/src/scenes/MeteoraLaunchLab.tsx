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

const METEORA_FACTS = [
  { label: "Powers", value: "Believe, Bags, daos.fun" },
  { label: "Curve", value: "Dynamic Bonding Curve" },
  { label: "Graduates to", value: "Meteora DAMM v2" },
  { label: "Base Fee", value: "1% trading fee" },
];

const LAUNCHLAB_FACTS = [
  { label: "Built by", value: "Raydium" },
  { label: "Curve", value: "Constant Product" },
  { label: "Graduates to", value: "Raydium CPMM" },
  { label: "Target", value: "~85 SOL" },
];

const PlatformColumn: React.FC<{
  title: string;
  gradient: string;
  color: string;
  facts: { label: string; value: string }[];
  code: string;
  startDelay: number;
}> = ({ title, gradient, color, facts, code, startDelay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, delay: startDelay, config: SMOOTH });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.1 }}>
          <GradientText gradient={gradient}>{title}</GradientText>
        </div>
      </div>

      {/* Facts */}
      {facts.map((fact, i) => {
        const factSpring = spring({ frame, fps, delay: startDelay + 10 + i * 8, config: SMOOTH });
        const factOpacity = interpolate(factSpring, [0, 1], [0, 1]);
        const factX = interpolate(factSpring, [0, 1], [30, 0]);

        return (
          <div
            key={fact.label}
            style={{
              opacity: factOpacity,
              transform: `translateX(${factX}px)`,
              padding: "16px 20px",
              borderRadius: 12,
              background: `${COLORS.bgCard}cc`,
              border: `1px solid ${color}15`,
            }}
          >
            <div style={{ fontSize: 12, color: COLORS.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              {fact.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.white }}>
              {fact.value}
            </div>
          </div>
        );
      })}

      {/* Code */}
      {(() => {
        const codeSpring = spring({ frame, fps, delay: startDelay + 50, config: SMOOTH });
        const codeOpacity = interpolate(codeSpring, [0, 1], [0, 1]);
        return (
          <div
            style={{
              opacity: codeOpacity,
              fontFamily: "'Courier New', monospace",
              fontSize: 13,
              color,
              background: "#0d0d15",
              padding: "14px 18px",
              borderRadius: 10,
              border: `1px solid ${color}20`,
            }}
          >
            <span style={{ color: COLORS.gray }}>$ </span>{code}
          </div>
        );
      })()}
    </div>
  );
};

export const MeteoraLaunchLab: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header
  const headerSpring = spring({ frame, fps, config: SMOOTH });
  const headerOpacity = interpolate(headerSpring, [0, 1], [0, 1]);

  // Divider
  const divSpring = spring({ frame, fps, delay: 5, config: SMOOTH });
  const divHeight = interpolate(divSpring, [0, 1], [0, 600]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: INTER,
        padding: 80,
        flexDirection: "column",
      }}
    >
      <GlowOrb color={COLORS.orange} size={500} x={200} y={-50} />
      <GlowOrb color={COLORS.purple} size={400} x={1400} y={500} pulseSpeed={80} />

      {/* Header */}
      <div
        style={{
          opacity: headerOpacity,
          textAlign: "center",
          marginBottom: 50,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.orange, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
          Bonding Curve Launchpads
        </div>
        <div style={{ fontSize: 48, fontWeight: 900, color: COLORS.white }}>
          <GradientText gradient={GRADIENT.fire}>Meteora</GradientText>
          {" + "}
          <GradientText gradient={GRADIENT.cool}>LaunchLab</GradientText>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: "flex", gap: 60, flex: 1 }}>
        <PlatformColumn
          title="Meteora DBC"
          gradient={GRADIENT.fire}
          color={COLORS.orange}
          facts={METEORA_FACTS}
          code="npx tsx scripts/meteora-launch.ts"
          startDelay={15}
        />

        {/* Center divider */}
        <div
          style={{
            width: 1,
            height: divHeight,
            background: `linear-gradient(180deg, transparent, ${COLORS.gray}30, transparent)`,
            alignSelf: "center",
          }}
        />

        <PlatformColumn
          title="LaunchLab"
          gradient={GRADIENT.cool}
          color={COLORS.purple}
          facts={LAUNCHLAB_FACTS}
          code="npx tsx scripts/launchlab-launch.ts"
          startDelay={25}
        />
      </div>
    </AbsoluteFill>
  );
};
