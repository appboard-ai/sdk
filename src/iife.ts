// IIFE entry — exposes Appboard on window for <script src> usage.
// The ESM build (./index.ts) is what npm consumers import.
import { createAppboard } from "./core";
import { renderBoard } from "./board";

declare global {
  interface Window {
    Appboard: {
      createAppboard: typeof createAppboard;
      renderBoard: typeof renderBoard;
    };
  }
}

window.Appboard = { createAppboard, renderBoard };
