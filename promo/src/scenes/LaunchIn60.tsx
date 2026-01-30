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
import { SMOOTH, SNAPPY } from "../lib/animations";

const TERMINAL_LINES = [
  { prompt: "$ ", cmd: "npx tsx scripts/setup.ts", delay: 0 },
  { prompt: "", cmd: '  ✓ Wallet: H7LU...Btee', delay: 40, color: COLORS.green },
  { prompt: "", cmd: "", delay: 55 },
  { prompt: "$ ", cmd: `npx tsx scripts/pumpfun-launch.ts '{"name":"Moon","symbol":"MOON"}'`, delay: 65 },
  { prompt: "", cmd: "  Creating token on Pump.fun...", delay: 105, color: COLORS.gray },
  { prompt: "", cmd: "  ✓ Mint: 7xKX...9mPq", delay: 135, color: COLORS.green },
  { prompt: "", cmd: "  ✓ Bonding curve active", delay: 150, color: COLORS.green },
  { prompt: "", cmd: '  ✓ pump.fun/coin/7xKX...9mPq', delay: 165, color: COLORS.cyan },
  { prompt: "", cmd: "", delay: 180 },
  { prompt: "", cmd: "  Token is LIVE! 🚀", delay: 195, color: COLORS.yellow },
];

const TerminalLine: React.FC<{
  line: typeof TERMINAL_LINES[0];
  frame: number;
}> = ({ line, frame }) => {
  const relFrame = frame - line.delay;
  if (relFrame < 0) return null;

  const typeSpeed = 1.2;
  const charsToShow = Math.floor(relFrame / typeSpeed);
  const fullText = line.prompt + line.cmd;
  const visibleText = fullText.slice(0, charsToShow);
  const isTyping = charsToShow < fullText.length;
  const cursorVisible = isTyping && frame % 16 < 8;

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 20,
        lineHeight: 1.8,
        color: line.color || COLORS.dimWhite,
        minHeight: 36,
      }}
    >
      {line.prompt && (
        <span style={{ color: COLORS.green }}>{visibleText.slice(0, line.prompt.length)}</span>
      )}
      <span>{visibleText.slice(line.prompt.length)}</span>
      {cursorVisible && <span style={{ color: COLORS.green }}>█</span>}
    </div>
  );
};

export const LaunchIn60: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleSpring = spring({ frame, fps, config: SMOOTH });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Terminal window
  const termSpring = spring({ frame, fps, delay: 15, config: SNAPPY });
  const termScale = interpolate(termSpring, [0, 1], [0.9, 1]);
  const termOpacity = interpolate(termSpring, [0, 1], [0, 1]);

  // Success badge at end
  const successSpring = spring({ frame, fps, delay: 210, config: SNAPPY });
  const successScale = interpolate(successSpring, [0, 1], [0.5, 1]);
  const successOpacity = interpolate(successSpring, [0, 1], [0, 1]);

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
      <GlowOrb color={COLORS.green} size={500} x={800} y={-50} pulseSpeed={70} />
      <GlowOrb color={COLORS.purple} size={400} x={200} y={700} pulseSpeed={90} />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 48,
          fontWeight: 900,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        <GradientText gradient={GRADIENT.solana}>Launch a Token</GradientText>
        <span style={{ color: COLORS.white }}> in Seconds</span>
      </div>

      {/* Terminal window */}
      <div
        style={{
          opacity: termOpacity,
          transform: `scale(${termScale})`,
          width: 900,
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${COLORS.purple}30`,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: "#1a1a2e",
            padding: "12px 20px",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f" }} />
          <span style={{ color: COLORS.gray, fontSize: 13, marginLeft: 12 }}>terminal</span>
        </div>

        {/* Terminal body */}
        <div
          style={{
            background: "#0d0d18",
            padding: "24px 28px",
            minHeight: 360,
          }}
        >
          {TERMINAL_LINES.map((line, i) => (
            <TerminalLine key={i} line={line} frame={frame} />
          ))}
        </div>
      </div>

      {/* Success badge */}
      <div
        style={{
          opacity: successOpacity,
          transform: `scale(${successScale})`,
          marginTop: 30,
          padding: "14px 40px",
          borderRadius: 12,
          background: GRADIENT.solana,
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.white,
        }}
      >
        From zero to on-chain in one command
      </div>
    </AbsoluteFill>
  );
};
