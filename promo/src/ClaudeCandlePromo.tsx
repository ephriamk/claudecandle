import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Intro } from "./scenes/Intro";
import { Platforms } from "./scenes/Platforms";
import { HowItWorks } from "./scenes/HowItWorks";
import { Features } from "./scenes/Features";
import { Outro } from "./scenes/Outro";

const TRANSITION_FRAMES = 15;

export const ClaudeCandlePromo: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Scene 1: Intro — logo + tagline reveal */}
      <TransitionSeries.Sequence durationInFrames={100}>
        <Intro />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      {/* Scene 2: Platform showcase — 5 launchpads */}
      <TransitionSeries.Sequence durationInFrames={130}>
        <Platforms />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      {/* Scene 3: How it works — 3 step cards */}
      <TransitionSeries.Sequence durationInFrames={140}>
        <HowItWorks />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      {/* Scene 4: Features + stats counters */}
      <TransitionSeries.Sequence durationInFrames={130}>
        <Features />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      {/* Scene 5: CTA / outro */}
      <TransitionSeries.Sequence durationInFrames={100}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
