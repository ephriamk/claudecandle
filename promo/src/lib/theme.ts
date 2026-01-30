export const COLORS = {
  bg: "#0a0a0f",
  bgCard: "#12121a",
  purple: "#9945FF",
  green: "#14F195",
  cyan: "#00D1FF",
  orange: "#FF6B35",
  pink: "#FF2D78",
  yellow: "#FFD700",
  white: "#FFFFFF",
  gray: "#8892B0",
  dimWhite: "#CCD6F6",
} as const;

export const GRADIENT = {
  solana: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.green})`,
  fire: `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.pink})`,
  cool: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.purple})`,
  gold: `linear-gradient(135deg, ${COLORS.yellow}, ${COLORS.orange})`,
} as const;

export const FONT = {
  heading: "Inter, sans-serif",
  mono: "'Fira Code', 'SF Mono', monospace",
} as const;

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;
