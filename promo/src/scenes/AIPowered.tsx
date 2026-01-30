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

const CHAT_MESSAGES = [
  {
    role: "user" as const,
    text: "Launch a meme coin called Moon Dog on Pump.fun with a 0.5 SOL initial buy",
    delay: 30,
  },
  {
    role: "assistant" as const,
    text: "Creating Moon Dog (MOON) on Pump.fun with 0.5 SOL initial buy...",
    delay: 90,
  },
  {
    role: "assistant" as const,
    text: "✓ Token launched!\n  Mint: 7xKX...9mPq\n  Bonding curve active\n  View: pump.fun/coin/7xKX...9mPq",
    delay: 150,
  },
];

const ChatBubble: React.FC<{
  message: typeof CHAT_MESSAGES[0];
}> = ({ message }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: SMOOTH });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [20, 0]);

  const isUser = message.role === "user";

  // Typing indicator for assistant messages
  const textLen = message.text.length;
  const typeSpeed = isUser ? 999 : 1.5;
  const charsVisible = isUser ? textLen : Math.min(textLen, Math.floor(frame / typeSpeed));

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          maxWidth: 650,
          padding: "16px 24px",
          borderRadius: 16,
          borderTopRightRadius: isUser ? 4 : 16,
          borderTopLeftRadius: isUser ? 16 : 4,
          background: isUser
            ? `linear-gradient(135deg, ${COLORS.purple}40, ${COLORS.purple}20)`
            : `${COLORS.bgCard}ee`,
          border: `1px solid ${isUser ? COLORS.purple : COLORS.gray}25`,
          fontSize: 18,
          lineHeight: 1.6,
          color: COLORS.dimWhite,
          whiteSpace: "pre-wrap",
        }}
      >
        {!isUser && (
          <div style={{ fontSize: 12, color: COLORS.cyan, fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>
            CLAUDE
          </div>
        )}
        {message.text.slice(0, charsVisible)}
        {!isUser && charsVisible < textLen && frame % 16 < 8 && (
          <span style={{ color: COLORS.cyan }}>▌</span>
        )}
      </div>
    </div>
  );
};

export const AIPowered: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: SMOOTH });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // MCP badges
  const mcpSpring = spring({ frame, fps, delay: 200, config: SNAPPY });
  const mcpOpacity = interpolate(mcpSpring, [0, 1], [0, 1]);
  const mcpScale = interpolate(mcpSpring, [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: INTER,
        padding: 80,
        flexDirection: "column",
      }}
    >
      <GlowOrb color={COLORS.purple} size={500} x={1300} y={100} pulseSpeed={60} />
      <GlowOrb color={COLORS.cyan} size={400} x={100} y={600} pulseSpeed={85} />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.purple, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
          AI-Powered
        </div>
        <div style={{ fontSize: 56, fontWeight: 900 }}>
          <span style={{ color: COLORS.white }}>Talk to </span>
          <GradientText gradient={GRADIENT.cool}>Claude.</GradientText>
          <span style={{ color: COLORS.white }}> Launch Tokens.</span>
        </div>
      </div>

      {/* Chat interface */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 800,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {CHAT_MESSAGES.map((msg, i) => (
          <Sequence from={msg.delay} key={i}>
            <ChatBubble message={msg} />
          </Sequence>
        ))}
      </div>

      {/* MCP badges */}
      <div
        style={{
          opacity: mcpOpacity,
          transform: `scale(${mcpScale})`,
          display: "flex",
          justifyContent: "center",
          gap: 16,
          marginTop: 20,
        }}
      >
        {["Claude Desktop", "Claude Code", "MCP Protocol", "10 Tools"].map((label, i) => {
          const badgeSpring = spring({ frame, fps, delay: 210 + i * 6, config: SMOOTH });
          const badgeOpacity = interpolate(badgeSpring, [0, 1], [0, 1]);
          return (
            <div
              key={label}
              style={{
                opacity: badgeOpacity,
                padding: "10px 20px",
                borderRadius: 20,
                background: `${COLORS.purple}15`,
                border: `1px solid ${COLORS.purple}30`,
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.purple,
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
