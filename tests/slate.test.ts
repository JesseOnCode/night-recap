import { describe, expect, it } from "vitest";
import { selectSlateDate } from "../src/nhl/slate";

describe("selectSlateDate", () => {
  it("vaihtaa tulevan kierroksen edelliseen päivään", () => {
    const result = selectSlateDate({
      currentDate: "2026-10-06",
      prevDate: "2026-10-05",
      games: [{ gameState: "FUT" }],
    });

    expect(result).toBe("2026-10-05");
  });

  it("pitää käynnissä olevan kierroksen", () => {
    const result = selectSlateDate({
      currentDate: "2026-10-06",
      prevDate: "2026-10-05",
      games: [{ gameState: "FUT" }, { gameState: "OFF" }],
    });

    expect(result).toBe("2026-10-06");
  });
});