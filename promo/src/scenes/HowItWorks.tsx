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

const STEPS = [
  {
    num: "01",
    title: "Setup",
    desc: "Generate a wallet and fund it with SOL",
    code: "npx tsx scripts/setup.ts",
    color: COLORS.cyan,
  },
  {
    num: "02",
    title: "Choose Platform",
    desc: "Pick from Raydium, Pump.fun, Meteora, LaunchLab, or auto.fun",
    code: '{"name":"Moon Dog","symbol":"MOON"}',
    color: COLORS.green,
  },
  {
    num: "03",
    title: "Launch",
    desc: "One command. Token is live on-chain.",
    code: "npx tsx scripts/pumpfun-launch.ts",
    color: COLORS.purple,
  },
];

const StepCard: React.FC<{ step: typeof STEPS[0]; index: number }> = ({
  step,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, delay: 10 + index * 15, config: SMOOTH });
  const translateY = interpolate(enter, [0, 1], [60, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  // Number pop
  const numScale = spring({ frame, fps, delay: 15 + index * 15, config: SNAPPY });

  // Code typing effect
  const codeDelay = 25 + index * 15;
  const charsToShow = Math.floor(
    interpolate(frame, [codeDelay, codeDelay + step.code.length * 1.5], [0, step.code.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const cursorVisible = frame % 20 < 10 && frame > codeDelay;

  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 500,
        padding: "40px 32px",
        borderRadius: 20,
        border: `1px solid ${step.color}25`,
        background: `${COLORS.bgCard}dd`,
      }}
    >
      {/* Number badge */}
      <div
        style={{
          transform: `scale(${numScale})`,
          width: 64,
          height: 64,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${step.color}30, ${step.color}10)`,
          border: `2px solid ${step.color}50`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 900,
          color: step.color,
          marginBottom: 20,
        }}
      >
        {step.num}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: COLORS.white,
          marginBottom: 8,
        }}
      >
        {step.title}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 17,
          color: COLORS.gray,
          textAlign: "center",
          marginBottom: 20,
          lineHeight: 1.4,
        }}
      >
        {step.desc}
      </div>

      {/* Code block */}
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 14,
          color: COLORS.green,
          background: "#0d0d15",
          padding: "12px 20px",
          borderRadius: 10,
          border: `1px solid ${COLORS.green}20`,
          width: "100%",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span style={{ color: COLORS.gray }}>$ </span>
        {step.code.slice(0, charsToShow)}
        {cursorVisible && <span style={{ color: COLORS.green }}>|</span>}
      </div>
    </div>
  );
};

export const HowItWorks: React.FC = () => {
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <GlowOrb color={COLORS.cyan} size={500} x={900} y={-100} pulseSpeed={90} />

      {/* Heading */}
      <div
        style={{
          transform: `translateY(${headingY}px)`,
          opacity: headingOpacity,
          textAlign: "center",
          marginBottom: 60,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.cyan,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          How It Works
        </div>
        <div style={{ fontSize: 56, fontWeight: 900, color: COLORS.white }}>
          <GradientText gradient={GRADIENT.solana}>Three Steps.</GradientText>{" "}
          Done.
        </div>
      </div>

      {/* Step cards */}
      <div style={{ display: "flex", gap: 32 }}>
        {STEPS.map((step, i) => (
          <StepCard key={step.num} step={step} index={i} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
