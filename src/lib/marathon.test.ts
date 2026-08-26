import assert from "node:assert/strict";
import test from "node:test";
import { calculateMarathonStandings } from "./marathon.ts";

test("MAJO lead uses the required copy and displays MAJO on the left", () => {
  const result = calculateMarathonStandings(
    [
      { year: 2011, team: "MAJO" },
      { year: 2012, team: "MAJO" },
      { year: 2013, team: "TORSK" },
    ],
    [],
  );

  assert.equal(result.majo, 2);
  assert.equal(result.torsk, 1);
  assert.deepEqual(result.left, { team: "MAJO", wins: 2 });
  assert.deepEqual(result.right, { team: "TORSK", wins: 1 });
  assert.equal(
    result.message,
    "MAJO leder med 2–1 (men alla vet att dom fuskar)",
  );
});

test("TORSK lead uses the required copy and displays TORSK on the left", () => {
  const result = calculateMarathonStandings(
    [
      { year: 2011, team: "TORSK" },
      { year: 2012, team: "TORSK" },
      { year: 2013, team: "MAJO" },
    ],
    [],
  );

  assert.deepEqual(result.left, { team: "TORSK", wins: 2 });
  assert.deepEqual(result.right, { team: "MAJO", wins: 1 });
  assert.equal(result.message, "TORSK leder med 2–1 (helt rättvist)");
});

test("tie is explicit and keeps stable MAJO-left order", () => {
  const result = calculateMarathonStandings(
    [
      { year: 2011, team: "MAJO" },
      { year: 2012, team: "TORSK" },
    ],
    [],
  );

  assert.deepEqual(result.left, { team: "MAJO", wins: 1 });
  assert.deepEqual(result.right, { team: "TORSK", wins: 1 });
  assert.equal(result.message, "Helt jämnt: 1–1");
});

test("digital season replaces historical row for the same year without double counting", () => {
  const result = calculateMarathonStandings(
    [
      { year: 2024, team: "MAJO" },
      { year: 2025, team: "TORSK" },
    ],
    [
      { year: 2024, winner: "TORSK" },
      { year: 2026, winner: "MAJO" },
    ],
  );

  assert.deepEqual(
    { majo: result.majo, torsk: result.torsk },
    { majo: 1, torsk: 2 },
  );
});

test("digital true ties and missing winners count for neither team", () => {
  const result = calculateMarathonStandings(
    [{ year: 2024, team: "MAJO" }],
    [
      { year: 2024, winner: "TIE" },
      { year: 2025, winner: null },
    ],
  );

  assert.deepEqual(
    { majo: result.majo, torsk: result.torsk },
    { majo: 0, torsk: 0 },
  );
});
