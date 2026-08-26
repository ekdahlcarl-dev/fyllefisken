export type MarathonTeam = "MAJO" | "TORSK";
export type MarathonWinner = MarathonTeam | "TIE" | null;

export type HistoricalWinner = {
  year: number;
  team: MarathonTeam | null;
};

export type DigitalWinner = {
  year: number;
  winner: MarathonWinner;
};

export type MarathonDisplayTeam = {
  team: MarathonTeam;
  wins: number;
};

export type MarathonStandings = {
  majo: number;
  torsk: number;
  left: MarathonDisplayTeam;
  right: MarathonDisplayTeam;
  message: string;
};

export function calculateMarathonStandings(
  historical: HistoricalWinner[],
  digital: DigitalWinner[],
): MarathonStandings {
  const winnerByYear = new Map<number, MarathonTeam>();

  for (const item of historical) {
    if (item.team === "MAJO" || item.team === "TORSK") {
      winnerByYear.set(item.year, item.team);
    }
  }

  // A digitally completed season is authoritative for its year and replaces
  // any historical winner row, preventing duplicate counting.
  for (const item of digital) {
    winnerByYear.delete(item.year);
    if (item.winner === "MAJO" || item.winner === "TORSK") {
      winnerByYear.set(item.year, item.winner);
    }
  }

  let majo = 0;
  let torsk = 0;
  for (const winner of winnerByYear.values()) {
    if (winner === "MAJO") majo += 1;
    if (winner === "TORSK") torsk += 1;
  }

  const left: MarathonDisplayTeam =
    torsk > majo
      ? { team: "TORSK", wins: torsk }
      : { team: "MAJO", wins: majo };
  const right: MarathonDisplayTeam =
    torsk > majo
      ? { team: "MAJO", wins: majo }
      : { team: "TORSK", wins: torsk };

  return {
    majo,
    torsk,
    left,
    right,
    message: marathonMessage(majo, torsk),
  };
}

export function marathonMessage(majo: number, torsk: number): string {
  if (majo > torsk) {
    return `MAJO leder med ${majo}–${torsk} (men alla vet att dom fuskar)`;
  }
  if (torsk > majo) {
    return `TORSK leder med ${torsk}–${majo} (helt rättvist)`;
  }
  return `Helt jämnt: ${majo}–${torsk}`;
}
