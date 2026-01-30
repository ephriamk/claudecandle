import React from "react";
import { Composition } from "remotion";
import { ClaudeCandlePromo } from "./ClaudeCandlePromo";
import { VIDEO } from "./lib/theme";

// Total: 100 + 130 + 140 + 130 + 100 = 600 frames - (4 * 15 transitions) = 540 frames
// 540 frames / 30 fps = 18 seconds

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main promo — 16:9 landscape (YouTube, Twitter) */}
      <Composition
        id="ClaudeCandlePromo"
        component={ClaudeCandlePromo}
        durationInFrames={540}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={VIDEO.fps}
      />

      {/* Vertical promo — 9:16 portrait (TikTok, Reels) */}
      <Composition
        id="ClaudeCandlePromoVertical"
        component={ClaudeCandlePromo}
        durationInFrames={540}
        width={1080}
        height={1920}
        fps={VIDEO.fps}
      />
    </>
  );
};
