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

export function storyImage(templateUrl: string): string {
  return templateUrl.replace("{formatInstructions}", "t_ratio16_9-size50");
}

export function storyPage(slug: string): string {
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
