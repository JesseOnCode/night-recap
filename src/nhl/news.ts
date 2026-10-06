export type StoryHit = {
  slug: string;
  headline: string;
  summary: string;
  contentDate: string;
  templateUrl: string;
  playerIds: number[];
};

export type NewsCard = {
  slug: string;
  headline: string;
  summary: string;
  published: string;
  imageUrl: string;
  pageUrl: string;
  player: string;
  team: string;
};

const imageHosts = new Set(["media.d3.nhle.com"]);

export function storyImage(templateUrl: string): string | null {
  const next = templateUrl.replace("{formatInstructions}", "t_ratio16_9-size50");
  let parsed: URL;

  try {
    parsed = new URL(next);
  } catch {
    return null;
  }

  if (
    parsed.protocol !== "https:" ||
    !imageHosts.has(parsed.hostname) ||
    parsed.username ||
    parsed.password
  ) {
    return null;
  }

  return parsed.toString();
}

export function storyPage(slug: string): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) {
    return null;
  }

  return `https://www.nhl.com/fi/news/${slug}`;
}

export function withinDays(contentDate: string, now: Date, days: number): boolean {
  const published = new Date(contentDate).getTime();
  if (Number.isNaN(published)) {
    return false;
  }

  const age = now.getTime() - published;
  return age >= 0 && age <= days * 24 * 60 * 60 * 1000;
}

export function relevantStory(
  story: StoryHit,
  playerId: number,
  lastName: string,
): boolean {
  if (!story.playerIds.includes(playerId) || !story.headline || !story.slug) {
    return false;
  }

  if (story.playerIds.length === 1) {
    return true;
  }

  return story.headline.toLowerCase().includes(lastName.toLowerCase());
}
