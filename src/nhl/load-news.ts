import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { mapPool, nhlJson } from "./client";
import { loadFinns, type Finn } from "./load-finns";
import { relevantStory, storyImage, storyPage, withinDays, type NewsCard, type StoryHit } from "./news";

type StoryTag = { slug?: string };

type StoryRaw = {
  slug?: string;
  headline?: string;
  summary?: string;
  contentDate?: string;
  thumbnail?: { templateUrl?: string };
  tags?: StoryTag[];
};

const ttlMs = 20 * 60 * 1000;
const cacheFile = path.join(process.cwd(), ".cache", "news.json");

let cache: { at: number; cards: NewsCard[] } | null = null;
let pendingRefresh: Promise<NewsCard[]> | null = null;

async function cachedCards(): Promise<NewsCard[]> {
  if (cache?.cards.length) {
    return cache.cards;
  }

  const stored = await readDisk();
  if (stored?.cards.length) {
    cache = stored;
    return stored.cards;
  }

  return [];
}

function scheduleRefresh(): void {
  if (pendingRefresh) {
    return;
  }

  pendingRefresh = refreshNews()
    .catch(async (error) => {
      console.error(error);
      return cachedCards();
    })
    .finally(() => {
      pendingRefresh = null;
    });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dedupeCards(groups: NewsCard[][]): NewsCard[] {
  const bySlug = new Map<string, NewsCard>();

  for (const card of groups.flat()) {
    const previous = bySlug.get(card.slug);
    if (!previous || card.published > previous.published) {
      bySlug.set(card.slug, card);
    }
  }

  return [...bySlug.values()]
    .sort((a, b) => b.published.localeCompare(a.published))
    .slice(0, 40);
}

async function readDisk(): Promise<{ at: number; cards: NewsCard[] } | null> {
  try {
    const parsed = JSON.parse(await readFile(cacheFile, "utf8")) as {
      at?: number;
      cards?: NewsCard[];
    };

    if (!Array.isArray(parsed.cards) || parsed.cards.length === 0) {
      return null;
    }

    return { at: parsed.at ?? 0, cards: parsed.cards };
  } catch {
    return null;
  }
}

async function writeDisk(stored: { at: number; cards: NewsCard[] }): Promise<void> {
  await mkdir(path.dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, JSON.stringify(stored));
}

function toHit(raw: StoryRaw): StoryHit | null {
  const templateUrl = raw.thumbnail?.templateUrl ?? "";
  if (!raw.slug || !raw.headline || !templateUrl) {
    return null;
  }

  return {
    slug: raw.slug,
    headline: raw.headline,
    summary: raw.summary ?? "",
    contentDate: raw.contentDate ?? "",
    templateUrl,
    playerIds: (raw.tags ?? [])
      .map((tag) => /^playerid-(\d+)$/.exec(tag.slug ?? ""))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => Number(match[1])),
  };
}

async function cardsFor(player: Finn): Promise<NewsCard[]> {
  const payload = await nhlJson<{ items?: StoryRaw[] }>(
    `https://forge-dapi.d3.nhle.com/v2/content/fi-fi/stories?tags.slug=playerid-${player.playerId}&$limit=15`,
    ttlMs,
  );

  return (payload.items ?? [])
    .map(toHit)
    .filter((story): story is StoryHit => story !== null)
    .filter((story) => relevantStory(story, player.playerId, player.lastName))
    .filter((story) => withinDays(story.contentDate, new Date(), 14))
    .flatMap((story) => {
      const imageUrl = storyImage(story.templateUrl);
      const pageUrl = storyPage(story.slug);

      if (!imageUrl || !pageUrl) {
        return [];
      }

      return [
        {
          slug: story.slug,
          headline: story.headline,
          summary: story.summary,
          published: story.contentDate,
          imageUrl,
          pageUrl,
          player: player.name,
          team: player.team,
        },
      ];
    });
}

async function refreshNews(): Promise<NewsCard[]> {
  const finns = await loadFinns();
  if (finns.length === 0) {
    return cachedCards();
  }

  const groups: NewsCard[][] = [];
  let pending = finns;

  for (let pass = 0; pass < 3 && pending.length > 0; pass++) {
    if (pass > 0) {
      await wait(1200);
    }

    const rows = await mapPool(pending, 2, async (player) => ({
      playerId: player.playerId,
      cards: await cardsFor(player),
    }));

    for (const row of rows) {
      groups.push(row.cards);
    }

    const done = new Set(rows.map((row) => row.playerId));
    pending = pending.filter((player) => !done.has(player.playerId));
  }

  const cards = dedupeCards(groups);

  if (cards.length > 0) {
    const stored = { at: Date.now(), cards };
    cache = stored;
    await writeDisk(stored);
    return cards;
  }

  return cachedCards();
}

export async function loadNews(): Promise<NewsCard[]> {
  const now = Date.now();

  if (cache && now - cache.at < ttlMs) {
    return cache.cards;
  }

  const stored = (await readDisk()) ?? cache;

  if (stored && now - stored.at < ttlMs) {
    cache = stored;
    return stored.cards;
  }

  if (stored && stored.cards.length > 0) {
    cache = stored;
    scheduleRefresh();
    return stored.cards;
  }

  scheduleRefresh();
  return pendingRefresh ?? cachedCards();
}