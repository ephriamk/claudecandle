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
import { SNAPPY } from "../lib/animations";

/**
 * Fast-cut sizzle reel — rapid-fire text + color bursts.
 * 8 seconds total, designed for short-form social.
 */

const CUTS = [
  { text: "Launch", gradient: GRADIENT.solana, duration: 25 },
  { text: "Meme Coins", gradient: GRADIENT.fire, duration: 25 },
  { text: "On Solana", gradient: GRADIENT.cool, duration: 25 },
  { text: "5 Platforms", gradient: GRADIENT.gold, duration: 30 },
  { text: "One Tool", gradient: GRADIENT.solana, duration: 30 },
  { text: "AI Powered", gradient: GRADIENT.cool, duration: 30 },
  { text: "🕯️", gradient: GRADIENT.solana, duration: 15, isEmoji: true },
  { text: "ClaudeCandle", gradient: GRADIENT.solana, duration: 60, isFinal: true },
];

const CutScene: React.FC<{
  text: string;
  gradient: string;
  isEmoji?: boolean;
  isFinal?: boolean;
}> = ({ text, gradient, isEmoji, isFinal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: SNAPPY });
  const scale = interpolate(enter, [0, 1], [isEmoji ? 0.3 : 1.5, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const rotation = isEmoji ? interpolate(enter, [0, 1], [30, 0]) : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: INTER,
      }}
    >
      {/* Flash effect on cut */}
      {frame < 3 && (
        <AbsoluteFill
          style={{
            backgroundColor: `rgba(255,255,255,${0.3 - frame * 0.1})`,
          }}
        />
      )}

      <div
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          opacity,
          fontSize: isEmoji ? 120 : isFinal ? 80 : 90,
          fontWeight: 900,
          textAlign: "center",
          letterSpacing: isEmoji ? 0 : -2,
        }}
      >
        {isEmoji ? (
          text
        ) : (
          <GradientText gradient={gradient}>{text}</GradientText>
        )}
      </div>

      {isFinal && (
        <div
          style={{
            position: "absolute",
            bottom: 200,
            opacity: interpolate(
              spring({ frame, fps, delay: 15, config: SNAPPY }),
              [0, 1],
              [0, 1]
            ),
            fontSize: 22,
            color: COLORS.gray,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Solana Meme Coin Launchpad
        </div>
      )}
    </AbsoluteFill>
  );
};

export const SizzleReel: React.FC = () => {
  let offset = 0;

  return (
    <AbsoluteFill>
      <GlowOrb color={COLORS.purple} size={400} x={400} y={300} pulseSpeed={30} />
      <GlowOrb color={COLORS.green} size={300} x={700} y={800} pulseSpeed={40} />

      {CUTS.map((cut, i) => {
        const from = offset;
        offset += cut.duration;
        return (
          <Sequence from={from} durationInFrames={cut.duration} key={i}>
            <CutScene
              text={cut.text}
              gradient={cut.gradient}
              isEmoji={cut.isEmoji}
              isFinal={cut.isFinal}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
