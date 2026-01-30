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

const STATS = [
  { label: "Launch Platforms", value: 5, suffix: "", color: COLORS.green },
  { label: "MCP Tools", value: 10, suffix: "", color: COLORS.cyan },
  { label: "CLI Scripts", value: 9, suffix: "", color: COLORS.purple },
  { label: "Lines of Code", value: 3, suffix: "K+", color: COLORS.orange },
];

const FEATURES = [
  { icon: "🤖", text: "Natural language launches via Claude" },
  { icon: "📦", text: "IPFS metadata with Pinata" },
  { icon: "⚡", text: "Instant Jupiter trading (Raydium)" },
  { icon: "🔒", text: "Mint authority auto-revoked" },
  { icon: "📊", text: "Real-time balance tracking" },
  { icon: "🌐", text: "Mainnet ready, production grade" },
];

const StatBlock: React.FC<{ stat: typeof STATS[0]; index: number }> = ({
  stat,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, delay: 5 + index * 8, config: SNAPPY });
  const scale = interpolate(enter, [0, 1], [0.5, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  const count = countUp(frame, 10 + index * 8, 25, stat.value);

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        textAlign: "center",
        minWidth: 180,
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: stat.color,
          lineHeight: 1,
        }}
      >
        {count}
        {stat.suffix}
      </div>
      <div
        style={{
          fontSize: 16,
          color: COLORS.gray,
          marginTop: 8,
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        {stat.label}
      </div>
    </div>
  );
};

const FeatureRow: React.FC<{ feature: typeof FEATURES[0]; index: number }> = ({
  feature,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, delay: 30 + index * 5, config: SMOOTH });
  const translateX = interpolate(enter, [0, 1], [-40, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        transform: `translateX(${translateX}px)`,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontSize: 22,
        color: COLORS.dimWhite,
        padding: "8px 0",
      }}
    >
      <span style={{ fontSize: 28 }}>{feature.icon}</span>
      {feature.text}
    </div>
  );
};

export const Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingSpring = spring({ frame, fps, config: SMOOTH });
  const headingOpacity = interpolate(headingSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: INTER,
        padding: 80,
      }}
    >
      <GlowOrb color={COLORS.orange} size={500} x={1300} y={600} pulseSpeed={75} />
      <GlowOrb color={COLORS.purple} size={400} x={100} y={-50} />

      {/* Stats row at top */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 80,
          marginBottom: 60,
          marginTop: 40,
        }}
      >
        {STATS.map((stat, i) => (
          <StatBlock key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          width: "60%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.purple}40, transparent)`,
          margin: "0 auto 50px",
          opacity: headingOpacity,
        }}
      />

      {/* Features heading + grid */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 120,
          opacity: headingOpacity,
        }}
      >
        <div>
          <div style={{ fontSize: 44, fontWeight: 900, marginBottom: 30 }}>
            <GradientText gradient={GRADIENT.cool}>Built for</GradientText>
            <br />
            <span style={{ color: COLORS.white }}>Production</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {FEATURES.slice(0, 3).map((f, i) => (
              <FeatureRow key={f.text} feature={f} index={i} />
            ))}
          </div>
        </div>
        <div style={{ paddingTop: 90 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {FEATURES.slice(3).map((f, i) => (
              <FeatureRow key={f.text} feature={f} index={i + 3} />
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
