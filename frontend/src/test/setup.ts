import "@testing-library/jest-dom/vitest";
import type {} from "vitest/jsdom";

// Node 26 also exposes localStorage; browser tests need jsdom's implementation.
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: jsdom.window.localStorage,
});
