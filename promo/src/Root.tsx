import React from "react";
import { Composition } from "remotion";
import { ClaudeCandlePromo } from "./ClaudeCandlePromo";
import { LaunchIn60 } from "./scenes/LaunchIn60";
import { PumpfunDive } from "./scenes/PumpfunDive";
import { RaydiumSpotlight } from "./scenes/RaydiumSpotlight";
import { AIPowered } from "./scenes/AIPowered";
import { FivePlatforms } from "./scenes/FivePlatforms";
import { DevCLI } from "./scenes/DevCLI";
import { Security } from "./scenes/Security";
import { MeteoraLaunchLab } from "./scenes/MeteoraLaunchLab";
import { SizzleReel } from "./scenes/SizzleReel";
import { VIDEO } from "./lib/theme";

const W = VIDEO.width;  // 1920
const H = VIDEO.height; // 1080
const FPS = VIDEO.fps;  // 30

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ===== Video 1: Hero Promo (main overview, 18s) ===== */}
      <Composition
        id="HeroPromo"
        component={ClaudeCandlePromo}
        durationInFrames={540}
        width={W}
        height={H}
        fps={FPS}
      />

      {/* ===== Video 2: Launch in 60 Seconds (terminal speed demo, 8s) ===== */}
      <Composition
        id="LaunchIn60"
        component={LaunchIn60}
        durationInFrames={250}
        width={W}
        height={H}
        fps={FPS}
      />

      {/* ===== Video 3: Pump.fun Deep Dive (platform spotlight, 12s) ===== */}
      <Composition
        id="PumpfunDive"
        component={PumpfunDive}
        durationInFrames={360}
        width={W}
        height={H}
        fps={FPS}
      />

      {/* ===== Video 4: Raydium CPMM Spotlight (instant Jupiter, 12s) ===== */}
      <Composition
        id="RaydiumSpotlight"
        component={RaydiumSpotlight}
        durationInFrames={360}
        width={W}
        height={H}
        fps={FPS}
      />

      {/* ===== Video 5: AI-Powered Launch (Claude MCP, 15s) ===== */}
      <Composition
        id="AIPowered"
        component={AIPowered}
        durationInFrames={450}
        width={W}
        height={H}
        fps={FPS}
      />

      {/* ===== Video 6: Five Platforms One Tool (comparison, 12s) ===== */}
      <Composition
        id="FivePlatforms"
        component={FivePlatforms}
        durationInFrames={360}
        width={W}
        height={H}
        fps={FPS}
      />

      {/* ===== Video 7: Developer CLI Showcase (9 scripts, 12s) ===== */}
      <Composition
        id="DevCLI"
        component={DevCLI}
        durationInFrames={360}
        width={W}
        height={H}
        fps={FPS}
      />

      {/* ===== Video 8: Security & Trust (mint revocation, 10s) ===== */}
      <Composition
        id="Security"
        component={Security}
        durationInFrames={300}
        width={W}
        height={H}
        fps={FPS}
      />

      {/* ===== Video 9: Meteora + LaunchLab (dual spotlight, 12s) ===== */}
      <Composition
        id="MeteoraLaunchLab"
        component={MeteoraLaunchLab}
        durationInFrames={360}
        width={W}
        height={H}
        fps={FPS}
      />

      {/* ===== Video 10: Sizzle Reel (fast-cut hype, 8s) ===== */}
      <Composition
        id="SizzleReel"
        component={SizzleReel}
        durationInFrames={240}
        width={W}
        height={H}
        fps={FPS}
      />

      {/* ===== Vertical variants (9:16 for TikTok/Reels) ===== */}
      <Composition
        id="SizzleReelVertical"
        component={SizzleReel}
        durationInFrames={240}
        width={1080}
        height={1920}
        fps={FPS}
      />
      <Composition
        id="FivePlatformsVertical"
        component={FivePlatforms}
        durationInFrames={360}
        width={1080}
        height={1920}
        fps={FPS}
      />
    </>
  );
};
