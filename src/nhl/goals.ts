const playerBase =
  "https://players.brightcove.net/6415718365001/default_default/index.html?videoId=";

export type RawGoal = {
  scorerId: number;
  assistIds: number[];
  period: number;
  time: string;
  highlightClip: number | null;
  sharingUrl: string | null;
};

export type GoalClip = {
  playerId: number;
  scorerId: number;
  kind: "goal" | "assist";
  period: number;
  time: string;
  videoId: number | null;
  videoUrl: string | null;
  pageUrl: string | null;
};

const videoHosts = new Set(["nhl.com", "www.nhl.com"]);

export function finnishVideoPage(url: string): string | null {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (
    parsed.protocol !== "https:" ||
    !videoHosts.has(parsed.hostname) ||
    parsed.username ||
    parsed.password
  ) {
    return null;
  }

  if (!parsed.pathname.includes("/fi/video/")) {
    parsed.pathname = parsed.pathname.replace("/video/", "/fi/video/");
  }

  return parsed.toString();
}

function videoUrlFor(clip: number | null): string | null {
  if (typeof clip !== "number" || !Number.isInteger(clip) || clip < 0) {
    return null;
  }

  return `${playerBase}${clip}`;
}

function clip(
  goal: RawGoal,
  playerId: number,
  kind: GoalClip["kind"],
): GoalClip {
  const videoUrl = videoUrlFor(goal.highlightClip);

  return {
    playerId,
    scorerId: goal.scorerId,
    kind,
    period: goal.period,
    time: goal.time,
    videoId: videoUrl === null ? null : goal.highlightClip,
    videoUrl,
    pageUrl: goal.sharingUrl === null ? null : finnishVideoPage(goal.sharingUrl),
  };
}

export function finnishHighlights(
  finnIds: number[],
  goals: RawGoal[],
): GoalClip[] {
  const rows: GoalClip[] = [];

  for (const goal of goals) {
    if (finnIds.includes(goal.scorerId)) {
      rows.push(clip(goal, goal.scorerId, "goal"));
    }

    for (const assistId of goal.assistIds) {
      if (finnIds.includes(assistId)) {
        rows.push(clip(goal, assistId, "assist"));
      }
    }
  }

  return rows.sort((a, b) => {
    if (a.period !== b.period) {
      return a.period - b.period;
    }

    if (a.time !== b.time) {
      return a.time.localeCompare(b.time);
    }

    if (a.kind !== b.kind) {
      return a.kind === "goal" ? -1 : 1;
    }

    return a.playerId - b.playerId;
  });
}