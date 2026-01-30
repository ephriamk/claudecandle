import { loadFont, fontFamily } from "@remotion/google-fonts/Inter";

const { waitUntilDone } = loadFont("normal", {
  weights: ["400", "600", "700", "900"],
  subsets: ["latin"],
});

export const INTER = fontFamily;
export const waitForFonts = waitUntilDone;
