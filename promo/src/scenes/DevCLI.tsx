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

const COMMANDS = [
  { cmd: "raydium-launch", desc: "Raydium CPMM pool", color: COLORS.cyan },
  { cmd: "pumpfun-launch", desc: "Pump.fun bonding curve", color: COLORS.green },
  { cmd: "meteora-launch", desc: "Meteora DBC", color: COLORS.orange },
  { cmd: "launchlab-launch", desc: "Raydium LaunchLab", color: COLORS.purple },
  { cmd: "launch", desc: "auto.fun bonding curve", color: COLORS.yellow },
  { cmd: "buy", desc: "Buy tokens with SOL", color: COLORS.cyan },
  { cmd: "sell", desc: "Sell tokens for SOL", color: COLORS.pink },
  { cmd: "balance", desc: "Wallet balances", color: COLORS.green },
  { cmd: "info", desc: "Bonding curve info", color: COLORS.gray },
];

export const DevCLI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: SMOOTH });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: INTER,
        padding: 80,
      }}
    >
      <GlowOrb color={COLORS.green} size={500} x={-100} y={200} />
      <GlowOrb color={COLORS.cyan} size={400} x={1400} y={600} pulseSpeed={80} />

      {/* Left: title */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 0,
          bottom: 0,
          width: "42%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.green, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
          Developer First
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
          <GradientText gradient={GRADIENT.solana}>9 Scripts.</GradientText>
          <br />
          <span style={{ color: COLORS.white }}>Pure CLI.</span>
        </div>
        <div style={{ fontSize: 20, color: COLORS.gray, lineHeight: 1.5, marginBottom: 24 }}>
          JSON in, JSON out. Every script outputs structured data to stdout. Pipe, parse, automate.
        </div>

        {/* Output example */}
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            background: "#0d0d15",
            padding: "16px 20px",
            borderRadius: 12,
            border: `1px solid ${COLORS.green}20`,
            color: COLORS.green,
            lineHeight: 1.6,
          }}
        >
          {`{`}<br />
          {`  "success": true,`}<br />
          {`  "mintAddress": "7xKX...9mPq",`}<br />
          {`  "signature": "4rVb...mK2a"`}<br />
          {`}`}
        </div>
      </div>

      {/* Right: command list */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 0,
          bottom: 0,
          width: "48%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {COMMANDS.map((c, i) => {
          const rowSpring = spring({ frame, fps, delay: 10 + i * 5, config: SMOOTH });
          const rowOpacity = interpolate(rowSpring, [0, 1], [0, 1]);
          const rowX = interpolate(rowSpring, [0, 1], [60, 0]);

          return (
            <div
              key={c.cmd}
              style={{
                opacity: rowOpacity,
                transform: `translateX(${rowX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 20px",
                borderRadius: 10,
                background: `${COLORS.bgCard}bb`,
                border: `1px solid ${c.color}15`,
              }}
            >
              <span style={{ color: COLORS.gray, fontFamily: "'Courier New', monospace", fontSize: 14 }}>$</span>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: 15, fontWeight: 600, color: c.color, minWidth: 200 }}>
                {c.cmd}
              </span>
              <span style={{ fontSize: 14, color: COLORS.gray }}>
                {c.desc}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
