import { describe, expect, it } from "vitest";
import { nightCacheUsable, nightCacheVersion } from "../src/nhl/load-night";

const now = Date.parse("2026-10-06T10:00:00Z");

describe("nightCacheUsable", () => {
  it("ei näytä edellistä yötä, kun kierros on vaihtunut", () => {
    const usable = nightCacheUsable(
      {
        at: now - 60_000,
        version: nightCacheVersion,
        page: { slateDate: "2026-10-04", gamesInProgress: false },
      },
      now,
      {
        currentDate: "2026-10-06",
        games: [{ gameState: "FUT" }],
      },
      "2026-10-05",
    );

    expect(usable).toBe(false);
  });

  it("näyttää päättyneen viime yön heti", () => {
    const usable = nightCacheUsable(
      {
        at: now - 6 * 60 * 60 * 1000,
        version: nightCacheVersion,
        page: { slateDate: "2026-10-05", gamesInProgress: false },
      },
      now,
      {
        currentDate: "2026-10-06",
        games: [{ gameState: "FUT" }],
      },
      "2026-10-05",
    );

    expect(usable).toBe(true);
  });

  it("hakee kesken olevan yön uudestaan", () => {
    const usable = nightCacheUsable(
      {
        at: now - 60_000,
        version: nightCacheVersion,
        page: { slateDate: "2026-10-06", gamesInProgress: true },
      },
      now,
      {
        currentDate: "2026-10-06",
        games: [{ gameState: "LIVE" }, { gameState: "FUT" }],
      },
      "2026-10-06",
    );

    expect(usable).toBe(false);
  });

  it("hylkää välimuistin, jossa ei ole nykyistä versiota", () => {
    const usable = nightCacheUsable(
      {
        at: now,
        page: { slateDate: "2026-10-05", gamesInProgress: false },
      },
      now,
      {
        currentDate: "2026-10-06",
        games: [{ gameState: "FUT" }],
      },
      "2026-10-05",
    );

    expect(usable).toBe(false);
  });
});
