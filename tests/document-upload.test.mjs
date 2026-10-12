import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const sourceUrl = new URL(
  "../src/lib/supabase/activity-document-dates.ts",
  import.meta.url,
);
const source = await readFile(sourceUrl, "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const dateModule = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);
const { normalizeStoredDate } = dateModule;

test("accepts valid date-only values and preserves the original calendar date", () => {
  assert.equal(normalizeStoredDate("2025-03-12"), "2025-03-12");
  assert.equal(
    normalizeStoredDate("2025-01-01T00:30:00+14:00"),
    "2025-01-01",
  );
  assert.equal(
    normalizeStoredDate("2024-12-31T23:30:00-08:00"),
    "2024-12-31",
  );
});

test("accepts ISO timestamps with reduced precision, fractions, and offsets", () => {
  assert.equal(normalizeStoredDate("2025-03-12T09:30Z"), "2025-03-12");
  assert.equal(normalizeStoredDate("2025-03-12T09Z"), "2025-03-12");
  assert.equal(
    normalizeStoredDate("2025-03-12T09:30:00.123456Z"),
    "2025-03-12",
  );
  assert.equal(normalizeStoredDate("2025-03-12T09:30:00,5Z"), "2025-03-12");
  assert.equal(
    normalizeStoredDate("2025-03-12T00:30:00+14:00"),
    "2025-03-12",
  );
  assert.equal(
    normalizeStoredDate("2025-03-12T23:30:00-08:00"),
    "2025-03-12",
  );
});

test("accepts only valid ISO end-of-day timestamps", () => {
  assert.equal(normalizeStoredDate("2025-03-12T24:00Z"), "2025-03-12");
  assert.equal(normalizeStoredDate("2025-03-12T24:00:00Z"), "2025-03-12");
  assert.equal(
    normalizeStoredDate("2025-03-12T24:00:00.000Z"),
    "2025-03-12",
  );
  assert.equal(normalizeStoredDate("2025-03-12T24Z"), null);
  assert.equal(normalizeStoredDate("2025-03-12T24:00:01Z"), null);
  assert.equal(normalizeStoredDate("2025-03-12T24:01:00Z"), null);
  assert.equal(normalizeStoredDate("2025-03-12T24:00:00.1Z"), null);
});

test("rejects missing, invalid, malformed, and unsupported dates", () => {
  assert.equal(normalizeStoredDate(null), null);
  assert.equal(normalizeStoredDate(""), null);
  assert.equal(normalizeStoredDate("not-a-date"), null);
  assert.equal(normalizeStoredDate("2025-02-30"), null);
  assert.equal(normalizeStoredDate("2025-03-12T09:30:00"), null);
  assert.equal(normalizeStoredDate("2025-03-12Tnot-a-time"), null);
  assert.equal(normalizeStoredDate("2025-03-12T25:00Z"), null);
  assert.equal(normalizeStoredDate("2025-03-12T09:60Z"), null);
  assert.equal(normalizeStoredDate("2025-03-12T09:30:60Z"), null);
  assert.equal(normalizeStoredDate("2025-03-12T09:30:00+14:01"), null);
  assert.equal(normalizeStoredDate("03/12/2025"), null);
});
