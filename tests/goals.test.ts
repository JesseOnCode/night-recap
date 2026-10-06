import { describe, expect, it } from "vitest";
import { finnishGoals } from "../src/nhl/goals";

describe("finnishGoals", () => {
  it("tekee suomalaisen maaleista kortit aikajärjestyksessä", () => {
    const clips = finnishGoals(
      [10],
      [
        {
          scorerId: 99,
          period: 1,
          time: "01:00",
          highlightClip: 1,
          sharingUrl: "https://nhl.com/video/muu",
        },
        {
          scorerId: 10,
          period: 3,
          time: "15:22",
          highlightClip: 222,
          sharingUrl: "https://nhl.com/video/rantanen",
        },
        {
          scorerId: 10,
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
});