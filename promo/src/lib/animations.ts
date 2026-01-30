import { spring, interpolate, type SpringConfig } from "remotion";

type SpringOpts = Partial<SpringConfig>;

export const SMOOTH: SpringOpts = { damping: 200 };
export const SNAPPY: SpringOpts = { damping: 20, stiffness: 200 };
export const BOUNCY: SpringOpts = { damping: 12, stiffness: 100 };

export function fadeIn(frame: number, start: number, duration: number): number {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function fadeOut(frame: number, start: number, duration: number): number {
  return interpolate(frame, [start, start + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function slideIn(
  frame: number,
  fps: number,
  delay = 0,
  config: SpringOpts = SMOOTH
): { opacity: number; translateY: number } {
  const s = spring({ frame, fps, delay, config });
  return {
    opacity: interpolate(s, [0, 1], [0, 1]),
    translateY: interpolate(s, [0, 1], [40, 0]),
  };
}

export function scaleIn(
  frame: number,
  fps: number,
  delay = 0,
  config: SpringOpts = SNAPPY
): { opacity: number; scale: number } {
  const s = spring({ frame, fps, delay, config });
  return {
    opacity: interpolate(s, [0, 1], [0, 1]),
    scale: interpolate(s, [0, 1], [0.6, 1]),
  };
}

export function countUp(
  frame: number,
  start: number,
  duration: number,
  target: number
): number {
  const progress = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.round(progress * target);
}
