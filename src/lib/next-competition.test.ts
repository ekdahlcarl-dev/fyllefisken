import assert from "node:assert/strict";
import test from "node:test";
import {
  formatCompetitionDateSpan,
  nextCompetitionYear,
} from "./next-competition.ts";

test("next competition year rolls forward dynamically", () => {
  assert.equal(nextCompetitionYear(2026), 2027);
  assert.equal(nextCompetitionYear(2027), 2028);
});

test("formats earliest and latest configured dates as a span", () => {
  assert.equal(
    formatCompetitionDateSpan([
      { competition_date: "2027-05-07" },
      { competition_date: "2027-05-05" },
      { competition_date: "2027-05-06" },
    ]),
    "2027-05-05 - 2027-05-07",
  );
});

test("uses a single date when only one usable date exists", () => {
  assert.equal(
    formatCompetitionDateSpan([
      { competition_date: null },
      { competition_date: "2027-05-05" },
    ]),
    "2027-05-05",
  );
});

test("returns null for empty competition dates", () => {
  assert.equal(formatCompetitionDateSpan([]), null);
  assert.equal(formatCompetitionDateSpan([{ competition_date: null }]), null);
});
