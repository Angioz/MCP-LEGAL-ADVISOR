/**
 * Offline tests for the US tools (fetch is mocked). Runs against the build: npm test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { handleUsFederal, handleUsStates } from "../../dist/tools/us.js";

const realFetch = globalThis.fetch;
const mockFetch = (fn: (url: string) => { status: number; body: unknown }) => {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const { status, body } = fn(String(input));
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
};

test("empty query is rejected", async () => {
  const r = await handleUsFederal({ query: "  " });
  assert.equal(r.status, "error");
  assert.equal((r as { code: string }).code, "INVALID_ARGUMENTS");
});

test("keyed tool without key returns a configuration error", async () => {
  delete process.env.OPENSTATES_API_KEY;
  const r = await handleUsStates({ query: "llc" });
  assert.equal((r as { code: string }).code, "CONFIGURATION_ERROR");
});

test("index still answers when live sources fail, with warnings", async () => {
  mockFetch(() => ({ status: 503, body: {} }));
  try {
    const r = await handleUsFederal({ query: "wyoming llc annual report" });
    assert.equal(r.status, "success");
    const data = (r as { data: { results: { title: string }[]; warnings: string[] } }).data;
    assert.ok(data.results.some((x) => x.title.includes("Wyoming")));
    assert.equal(data.warnings.length, 2);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("eCFR results are mapped and historical versions dropped", async () => {
  mockFetch((url) =>
    url.includes("ecfr.gov")
      ? {
          status: 200,
          body: {
            results: [
              { ends_on: "2020-01-01", hierarchy: { title: "26", section: "1.1" }, headings: {} },
              { ends_on: null, hierarchy: { title: "26", part: "301", section: "301.7701-3" }, headings: { section: "Classification" }, full_text_excerpt: "<strong>LLC</strong> rule" },
            ],
          },
        }
      : { status: 200, body: { results: [] } }
  );
  try {
    const r = await handleUsFederal({ query: "zzqx" });
    const results = (r as { data: { results: { url: string; description: string; source: string }[] } }).data.results;
    const ecfr = results.filter((x) => x.source === "eCFR");
    assert.equal(ecfr.length, 1);
    assert.equal(ecfr[0].url, "https://www.ecfr.gov/current/title-26/section-301.7701-3");
    assert.equal(ecfr[0].description, "LLC rule");
  } finally {
    globalThis.fetch = realFetch;
  }
});
