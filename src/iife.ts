// IIFE entry — exposes Appboard on window for <script src> usage.
// The ESM build (./index.ts) is what npm consumers import.
import { Appboard } from "./index";

declare global {
  interface Window {
    AppboardSDK: { Appboard: typeof Appboard };
  }
}

window.AppboardSDK = { Appboard };
