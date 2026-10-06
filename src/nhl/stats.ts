const dash = "–";

export type NightPlayer = {
  playerId: number;
  name: string;
  lastName: string;
  team: string;
  game: string;
  position: string;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number;
  sog: number;
  hits: number;
  blockedShots: number;
  toi: string;
  shifts: number;
  giveaways: number;
  takeaways: number;
  powerPlayGoals: number;
  faceoffWinningPctg: number;
  saves: number | null;
  savePctg: number | null;
  goalsAgainst: number | null;
  decision: string | null;
};

export type TableRow = {
  playerId: number;
  player: string;
  game: string;
  goals: string;
  assists: string;
  points: string;
  plusMinus: string;
  pim: string;
  shots: string;
  hits: string;
  blocks: string;
  toi: string;
  shifts: string;
  giveaways: string;
  takeaways: string;
  powerPlayGoals: string;
  faceoffPct: string;
  saves: string;
  savePct: string;
  goalsAgainst: string;
  decision: string;
};

export function formatFaceoff(value: number): string {
  if (value === 0) {
    return dash;
  }

  return (value * 100).toFixed(1).replace(".", ",");
}

export function formatSavePct(value: number): string {
  return (value * 100).toFixed(1).replace(".", ",");
}

function formatPlusMinus(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

export function buildTableRows(players: NightPlayer[]): TableRow[] {
  const sorted = [...players].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.goals !== a.goals) {
      return b.goals - a.goals;
    }

    return a.lastName.localeCompare(b.lastName, "fi");
  });

  return sorted.map((player) => {
    const goalie = player.position === "G";

    return {
      playerId: player.playerId,
      player: `${player.name}, ${player.team}`,
      game: player.game,
      goals: goalie ? dash : String(player.goals),
      assists: goalie ? dash : String(player.assists),
      points: goalie ? dash : String(player.points),
      plusMinus: goalie ? dash : formatPlusMinus(player.plusMinus),
      pim: String(player.pim),
      shots: goalie ? dash : String(player.sog),
      hits: goalie ? dash : String(player.hits),
      blocks: goalie ? dash : String(player.blockedShots),
      toi: player.toi,
      shifts: goalie ? dash : String(player.shifts),
      giveaways: goalie ? dash : String(player.giveaways),
      takeaways: goalie ? dash : String(player.takeaways),
      powerPlayGoals: goalie ? dash : String(player.powerPlayGoals),
      faceoffPct: goalie ? dash : formatFaceoff(player.faceoffWinningPctg),
      saves: goalie ? String(player.saves) : dash,
      savePct:
        goalie && player.savePctg !== null
          ? formatSavePct(player.savePctg)
          : dash,
      goalsAgainst: goalie ? String(player.goalsAgainst) : dash,
      decision: goalie && player.decision ? player.decision : dash,
    };
  });
}