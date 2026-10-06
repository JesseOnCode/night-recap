import { describe, expect, it } from "vitest";
import { finnishHighlights } from "../src/nhl/goals";

describe("finnishHighlights", () => {
  it("tekee suomalaisen maaleista kortit aikajärjestyksessä", () => {
    const clips = finnishHighlights(
      [10],
      [
        {
          scorerId: 99,
          assistIds: [],
          period: 1,
          time: "01:00",
          highlightClip: 1,
          sharingUrl: "https://nhl.com/video/muu",
        },
        {
          scorerId: 10,
          assistIds: [],
          period: 3,
          time: "15:22",
          highlightClip: 222,
          sharingUrl: "https://nhl.com/video/rantanen",
        },
        {
          scorerId: 10,
          assistIds: [],
          period: 1,
          time: "18:51",
          highlightClip: null,
          sharingUrl: null,
        },
      ],
    );

    expect(clips).toHaveLength(2);
    expect(clips[0].time).toBe("18:51");
    expect(clips[0].videoId).toBe(null);
    expect(clips[1].videoUrl).toBe(
      "https://players.brightcove.net/6415718365001/default_default/index.html?videoId=222",
    );
    expect(clips[1].pageUrl).toBe("https://nhl.com/fi/video/rantanen");
  });

  it("hylkää videolinkin, joka ei ole NHL:n osoite", () => {
    const clips = finnishHighlights(
      [10],
      [
        {
          scorerId: 10,
          assistIds: [],
          period: 1,
          time: "01:00",
          highlightClip: 5,
          sharingUrl: "javascript:alert(1)",
        },
        {
          scorerId: 10,
          assistIds: [],
          period: 2,
          time: "02:00",
          highlightClip: 6,
          sharingUrl: "https://example.com/video/muu",
        },
      ],
    );

    expect(clips.map((clip) => clip.pageUrl)).toEqual([null, null]);
    expect(clips[0].videoUrl).toBe(
      "https://players.brightcove.net/6415718365001/default_default/index.html?videoId=5",
    );
  });

  it("näyttää suomalaisen syötön samasta koosteesta", () => {
    const clips = finnishHighlights(
      [10, 24],
      [
        {
          scorerId: 10,
          assistIds: [24, 14],
          period: 1,
          time: "18:51",
          highlightClip: 500,
          sharingUrl: "https://nhl.com/video/heiskanen",
        },
        {
          scorerId: 14,
          assistIds: [24],
          period: 2,
          time: "06:19",
          highlightClip: 600,
          sharingUrl: null,
        },
      ],
    );

    expect(clips.map((clip) => [clip.playerId, clip.kind, clip.videoId])).toEqual([
      [10, "goal", 500],
      [24, "assist", 500],
      [24, "assist", 600],
    ]);
  });
});