import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCompetitionScore,
  type ScoringCatch,
} from "./scoring.ts";

const c = (
  team: "MAJO" | "TORSK",
  dayNumber: 1 | 2 | 3,
  lengthCm: number,
): ScoringCatch => ({ team, dayNumber, lengthCm });

test("0–4 catches are summed entirely into Big Five", () => {
  const score = calculateCompetitionScore(
    [c("MAJO", 1, 70), c("MAJO", 1, 80), c("MAJO", 1, 90)],
    false,
  );

  assert.deepEqual(score.days[0].teams.MAJO.topFiveLengths, [90, 80, 70]);
  assert.equal(score.days[0].teams.MAJO.bigFiveTotalCm, 240);
});

test("exactly five catches all contribute", () => {
  const score = calculateCompetitionScore(
    [50, 60, 70, 80, 90].map((length) => c("MAJO", 1, length)),
    false,
  );

  assert.equal(score.days[0].teams.MAJO.bigFiveTotalCm, 350);
});

test("more than five catches uses only the five longest", () => {
  const score = calculateCompetitionScore(
    [40, 50, 60, 70, 80, 90, 100].map((length) =>
      c("MAJO", 1, length),
    ),
    false,
  );

  assert.deepEqual(score.days[0].teams.MAJO.topFiveLengths, [100, 90, 80, 70, 60]);
  assert.equal(score.days[0].teams.MAJO.bigFiveTotalCm, 400);
  assert.equal(score.days[0].teams.MAJO.totalLengthCm, 490);
});

test("equal scoring categories split points 0.5 / 0.5", () => {
  const score = calculateCompetitionScore(
    [c("MAJO", 1, 90), c("TORSK", 1, 90)],
    false,
  );

  assert.deepEqual(score.days[0].longestPoints, { MAJO: 0.5, TORSK: 0.5 });
  assert.deepEqual(score.days[0].bigFivePoints, { MAJO: 0.5, TORSK: 0.5 });
});

test("daily Big Five never includes another day's catches", () => {
  const score = calculateCompetitionScore(
    [c("MAJO", 1, 50), c("MAJO", 2, 150), c("TORSK", 1, 60)],
    false,
  );

  assert.equal(score.days[0].teams.MAJO.bigFiveTotalCm, 50);
  assert.equal(score.days[1].teams.MAJO.bigFiveTotalCm, 150);
});

test("three-day Big Five uses five longest from combined pool", () => {
  const score = calculateCompetitionScore(
    [
      c("MAJO", 1, 70),
      c("MAJO", 1, 90),
      c("MAJO", 2, 100),
      c("MAJO", 2, 80),
      c("MAJO", 3, 110),
      c("MAJO", 3, 60),
    ],
    false,
  );

  assert.deepEqual(score.overall.teams.MAJO.topFiveLengths, [110, 100, 90, 80, 70]);
  assert.equal(score.overall.teams.MAJO.bigFiveTotalCm, 450);
});

test("all-catch totals never affect awarded points", () => {
  const score = calculateCompetitionScore(
    [
      c("MAJO", 1, 100),
      c("MAJO", 1, 99),
      c("MAJO", 1, 98),
      c("MAJO", 1, 97),
      c("MAJO", 1, 96),
      ...Array.from({ length: 20 }, () => c("TORSK", 1, 10)),
    ],
    false,
  );

  assert.ok(score.days[0].teams.TORSK.totalLengthCm > 0);
  assert.deepEqual(score.days[0].longestPoints, { MAJO: 1, TORSK: 0 });
  assert.deepEqual(score.days[0].bigFivePoints, { MAJO: 1, TORSK: 0 });
});

test("results are independent of insertion order", () => {
  const catches = [
    c("MAJO", 1, 81),
    c("MAJO", 2, 91),
    c("TORSK", 1, 82),
    c("TORSK", 3, 92),
    c("MAJO", 3, 101),
    c("TORSK", 2, 99),
  ];

  const forward = calculateCompetitionScore(catches, true);
  const reverse = calculateCompetitionScore([...catches].reverse(), true);
  assert.deepEqual(forward, reverse);
});

test("corrected catch is reflected immediately when recalculated", () => {
  const original = [c("MAJO", 1, 80), c("TORSK", 1, 90)];
  const corrected = [c("MAJO", 1, 100), c("TORSK", 1, 90)];

  assert.deepEqual(calculateCompetitionScore(original, false).days[0].longestPoints, {
    MAJO: 0,
    TORSK: 1,
  });
  assert.deepEqual(calculateCompetitionScore(corrected, false).days[0].longestPoints, {
    MAJO: 1,
    TORSK: 0,
  });
});

test("winner stays hidden until competition is complete", () => {
  const score = calculateCompetitionScore(
    [c("MAJO", 1, 100), c("TORSK", 1, 90)],
    false,
  );

  assert.equal(score.winner, null);
});

test("final-score tie is broken by longest, then next-longest pike", () => {
  const score = calculateCompetitionScore(
    [
      c("MAJO", 1, 100),
      c("MAJO", 2, 80),
      c("TORSK", 1, 100),
      c("TORSK", 2, 79),
    ],
    true,
  );

  assert.equal(score.points.MAJO, score.points.TORSK);
  assert.equal(score.winner, "MAJO");
});

test("identical comparable catch sequences produce a true tie", () => {
  const score = calculateCompetitionScore(
    [
      c("MAJO", 1, 100),
      c("MAJO", 2, 80),
      c("TORSK", 1, 100),
      c("TORSK", 2, 80),
    ],
    true,
  );

  assert.equal(score.points.MAJO, score.points.TORSK);
  assert.equal(score.winner, "TIE");
});
