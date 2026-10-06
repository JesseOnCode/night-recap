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

export function finnishVideoPage(url: string): string {
  if (url.includes("/fi/video/")) {
    return url;
  }

  return url.replace("/video/", "/fi/video/");
}

function clip(
  goal: RawGoal,
  playerId: number,
  kind: GoalClip["kind"],
): GoalClip {
  return {
    playerId,
    scorerId: goal.scorerId,
    kind,
    period: goal.period,
    time: goal.time,
    videoId: goal.highlightClip,
    videoUrl:
      goal.highlightClip === null ? null : playerBase + goal.highlightClip,
    pageUrl:
      goal.sharingUrl === null ? null : finnishVideoPage(goal.sharingUrl),
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