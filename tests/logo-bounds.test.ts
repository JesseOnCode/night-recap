import { describe, expect, it } from "vitest";
import { croppedViewBox, pathBounds } from "../src/nhl/logo-bounds";

describe("pathBounds", () => {
  it("ottaa mukaan käyrän, joka pullistuu päätepisteiden ulkopuolelle", () => {
    const svg = `<svg viewBox="0 0 100 100"><path d="M10 50C10 50 80 10 10 50"/></svg>`;
    const bounds = pathBounds(svg);

    expect(bounds?.maxX).toBeGreaterThan(40);
    expect(bounds?.minY).toBeLessThan(50);
  });

  it("ei katkaise polkua pehmeään käyrään", () => {
    const svg = `<svg viewBox="0 0 200 80"><path d="M10 40C10 10 40 10 40 40s30 30 60 0"/></svg>`;
    const bounds = pathBounds(svg);

    expect(bounds?.maxX).toBeGreaterThan(90);
  });
});

describe("croppedViewBox", () => {
  it("ei laajenna lyhyttä kaarta koko ympyräksi", () => {
    const svg = `<svg viewBox="0 0 960 640"><path d="M100 100a36948 36948 0 0 1-10 -30"/></svg>`;
    const bounds = pathBounds(svg);

    expect(bounds?.minX).toBeGreaterThan(70);
    expect(bounds?.maxX).toBeLessThan(120);
    expect(bounds?.minY).toBeGreaterThan(50);
    expect(bounds?.maxY).toBeLessThan(120);
  });

  it("jättää pienen marginaalin kuvan ympärille", () => {
    const svg = `<svg viewBox="0 0 400 200"><path d="M20 20H120V80H20Z"/></svg>`;
    const box = croppedViewBox(svg)?.split(" ").map(Number) ?? [];

    expect(box[0]).toBeLessThan(20);
    expect(box[1]).toBeLessThan(20);
    expect(box[0] + box[2]).toBeGreaterThan(120);
    expect(box[1] + box[3]).toBeGreaterThan(80);
  });
});
