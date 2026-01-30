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

const SECURITY_FEATURES = [
  {
    icon: "🔒",
    title: "Mint Authority Revoked",
    desc: "After minting total supply, mint authority is set to null. No one can mint more tokens — ever.",
    color: COLORS.green,
  },
  {
    icon: "📦",
    title: "IPFS Metadata",
    desc: "Token metadata stored on IPFS via Pinata. Decentralized, permanent, tamper-proof.",
    color: COLORS.cyan,
  },
  {
    icon: "⚙️",
    title: "SPL Token Standard",
    desc: "Standard SPL tokens, not Token2022. Maximum compatibility across all wallets and DEXes.",
    color: COLORS.purple,
  },
  {
    icon: "🛡️",
    title: "On-Chain Verification",
    desc: "Metaplex metadata on-chain. Token info verifiable by anyone on Solana Explorer.",
    color: COLORS.orange,
  },
];

export const Security: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Shield icon
  const shieldSpring = spring({ frame, fps, delay: 0, config: SNAPPY });
  const shieldScale = interpolate(shieldSpring, [0, 1], [0, 1]);
  const shieldRotate = interpolate(shieldSpring, [0, 1], [-15, 0]);

  // Title
  const titleSpring = spring({ frame, fps, delay: 8, config: SMOOTH });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Lock pulse
  const lockPulse = interpolate(
    Math.sin((frame / 30) * Math.PI * 2),
    [-1, 1],
    [0.5, 1]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: INTER,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <GlowOrb color={COLORS.green} size={500} x={900} y={-50} pulseSpeed={70} />
      <GlowOrb color={COLORS.purple} size={400} x={100} y={600} pulseSpeed={90} />

      {/* Shield + title */}
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <div
          style={{
            transform: `scale(${shieldScale}) rotate(${shieldRotate}deg)`,
            fontSize: 64,
            marginBottom: 16,
            filter: `drop-shadow(0 0 ${20 * lockPulse}px ${COLORS.green}80)`,
          }}
        >
          🛡️
        </div>
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 900 }}>
            <GradientText gradient={GRADIENT.solana}>Built for Trust</GradientText>
          </div>
          <div style={{ fontSize: 22, color: COLORS.gray, marginTop: 12 }}>
            Production-grade security, out of the box
          </div>
        </div>
      </div>

      {/* Feature cards — 2x2 grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          maxWidth: 1100,
          width: "100%",
        }}
      >
        {SECURITY_FEATURES.map((feat, i) => {
          const cardSpring = spring({ frame, fps, delay: 25 + i * 10, config: SMOOTH });
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const cardY = interpolate(cardSpring, [0, 1], [30, 0]);

          return (
            <div
              key={feat.title}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                padding: "28px 32px",
                borderRadius: 16,
                background: `${COLORS.bgCard}dd`,
                border: `1px solid ${feat.color}20`,
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 36, flexShrink: 0 }}>{feat.icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>
                  {feat.title}
                </div>
                <div style={{ fontSize: 15, color: COLORS.gray, lineHeight: 1.5 }}>
                  {feat.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
