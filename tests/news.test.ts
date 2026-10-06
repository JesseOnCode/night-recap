import { describe, expect, it } from "vitest";
import { relevantStory, storyImage, storyPage, withinDays, type StoryHit } from "../src/nhl/news";

const profile: StoryHit = {
  slug: "2026-27-player-profile-miro-heiskanen",
  headline: "2026-27 Player Profile: Miro Heiskanen",
  summary: "Name: Miro Heiskanen",
  contentDate: "2026-08-12T17:00:00Z",
  templateUrl:
    "https://media.d3.nhle.com/image/private/{formatInstructions}/prd/kuva",
  playerIds: [8480036],
};

const list: StoryHit = {
  ...profile,
  slug: "top-defensemen",
  headline: "NHL Network ranks the top defensemen",
  playerIds: [8480036, 8478420],
};

describe("relevantStory", () => {
  it("pitää jutun, joka on merkitty vain tälle pelaajalle", () => {
    expect(relevantStory(profile, 8480036, "Heiskanen")).toBe(true);
  });

  it("hylkää listauksen, jonka otsikossa pelaajaa ei ole", () => {
    expect(relevantStory(list, 8480036, "Heiskanen")).toBe(false);
  });

  it("pitää listauksen, kun otsikossa on pelaajan sukunimi", () => {
    expect(
      relevantStory(
        { ...list, headline: "Heiskanen among the top defensemen" },
        8480036,
        "Heiskanen",
      ),
    ).toBe(true);
  });
});

describe("withinDays", () => {
  it("pitää kahden viikon sisällä julkaistun jutun", () => {
    const now = new Date("2026-10-06T12:00:00Z");

    expect(withinDays("2026-10-02T17:00:00Z", now, 14)).toBe(true);
    expect(withinDays("2026-08-12T17:00:00Z", now, 14)).toBe(false);
  });
});
describe("story links", () => {
  it("tekee kuvan ja jutun osoitteen", () => {
    expect(storyImage(profile.templateUrl)).toBe(
      "https://media.d3.nhle.com/image/private/t_ratio16_9-size50/prd/kuva",
    );
    expect(storyPage(profile.slug)).toBe(
      "https://www.nhl.com/fi/news/2026-27-player-profile-miro-heiskanen",
    );
  });

  it("hylkää kuvan ja jutun, joiden osoite ei ole NHL:n", () => {
    expect(storyImage("https://example.com/{formatInstructions}/kuva")).toBeNull();
    expect(storyImage("javascript:alert(1)")).toBeNull();
    expect(storyPage("../admin")).toBeNull();
    expect(storyPage("javascript:alert(1)")).toBeNull();
  });
});
