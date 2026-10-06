const playerBase =
  "https://players.brightcove.net/6415718365001/default_default/index.html?videoId=";

export type RawGoal = {
  scorerId: number;
  period: number;
  time: string;
  highlightClip: number | null;
  sharingUrl: string | null;
};

export type GoalClip = {
  playerId: number;
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

export function finnishGoals(finnIds: number[], goals: RawGoal[]): GoalClip[] {
  return goals
    .filter((goal) => finnIds.includes(goal.scorerId))
    .sort((a, b) => {
      if (a.period !== b.period) {
        return a.period - b.period;
      }

      return a.time.localeCompare(b.time);
    })
    .map((goal) => ({
      playerId: goal.scorerId,
      period: goal.period,
      time: goal.time,
      videoId: goal.highlightClip,
      videoUrl:
        goal.highlightClip === null ? null : playerBase + goal.highlightClip,
      pageUrl:
        goal.sharingUrl === null ? null : finnishVideoPage(goal.sharingUrl),
    }));
}