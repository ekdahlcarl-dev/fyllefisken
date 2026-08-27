import assert from "node:assert/strict";
import test from "node:test";
import {
  canViewCatch,
  releasedDayIds,
  visibleArchiveYears,
} from "./competition-visibility.ts";

test("members see only own-team catches before result release", () => {
  assert.equal(canViewCatch(1, 1, false), true);
  assert.equal(canViewCatch(1, 2, false), false);
  assert.equal(canViewCatch(2, 1, false), false);
  assert.equal(canViewCatch(2, 2, false), true);
});

test("both teams see catches after result release", () => {
  assert.equal(canViewCatch(1, 2, true), true);
  assert.equal(canViewCatch(2, 1, true), true);
});

test("unassigned users cannot see private catches", () => {
  assert.equal(canViewCatch(null, 1, false), false);
  assert.equal(canViewCatch(null, 2, false), false);
});

test("released day helper excludes locked days", () => {
  const ids = releasedDayIds([
    { id: "day-1", results_released_at: "2026-08-27T08:00:00Z" },
    { id: "day-2", results_released_at: null },
  ]);
  assert.deepEqual([...ids], ["day-1"]);
});

test("winner archive never includes future years", () => {
  const years = visibleArchiveYears(2026);
  assert.equal(years[0], 2026);
  assert.equal(years.at(-1), 2011);
  assert.equal(years.includes(2099), false);
});
