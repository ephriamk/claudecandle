import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

export const GlowOrb: React.FC<{
  color: string;
  size: number;
  x: number;
  y: number;
  pulseSpeed?: number;
}> = ({ color, size, x, y, pulseSpeed = 60 }) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(
    Math.sin((frame / pulseSpeed) * Math.PI * 2),
    [-1, 1],
    [0.6, 1]
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size * pulse,
        height: size * pulse,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}40 0%, ${color}00 70%)`,
        filter: "blur(40px)",
        pointerEvents: "none",
      }}
    />
  );
};
