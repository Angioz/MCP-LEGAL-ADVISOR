/**
 * United States tools: federal law (index + eCFR + Federal Register),
 * US Code / public laws / bills (GovInfo), 50-state bills (Open States),
 * and court opinions (CourtListener).
 */

import { createJurisdictionHandler, type SearchResult } from "../handlers/generic-handler.js";
import { US_LAWS } from "../data/laws-us.js";

type Json = Record<string, any>;

const stripHtml = (s: unknown): string =>
  typeof s === "string" ? s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";

const take = (body: string, key: string, limit: number): Json[] => {
  const list = (JSON.parse(body) as Json)[key];
  return Array.isArray(list) ? list.slice(0, limit) : [];
};

const enc = encodeURIComponent;

/** Federal: pre-indexed key laws + live eCFR (regulations) + live Federal Register (new rules). */
export const handleUsFederal = createJurisdictionHandler({
  toolName: "legal_search_us",
  displayName: "US federal law",
  source: "Pre-indexed US laws + eCFR (ecfr.gov) + Federal Register (federalregister.gov)",
  indexedLaws: US_LAWS,
  searchUrl: (q) => `https://www.ecfr.gov/search?search[query]=${enc(q)}`,
  liveSearches: [
    {
      name: "eCFR",
      request: (q, limit) => ({
        url: `https://www.ecfr.gov/api/search/v1/results?query=${enc(q)}&per_page=${limit * 2}`,
      }),
      parse: (body, limit): SearchResult[] =>
        take(body, "results", 100)
          .filter((r) => r.ends_on == null && !r.removed)
          .slice(0, limit)
          .map((r) => {
            const h = r.hierarchy ?? {};
            const path = h.section ? `section-${h.section}` : `part-${h.part}`;
            return {
              title: `${h.title} CFR ${h.section ? `§ ${h.section}` : `Part ${h.part}`} — ${r.headings?.section ?? r.headings?.part ?? ""}`.trim(),
              reference: `${h.title} C.F.R. ${h.section ? `§ ${h.section}` : `Part ${h.part}`}`,
              description: stripHtml(r.full_text_excerpt),
              url: `https://www.ecfr.gov/current/title-${h.title}/${path}`,
              type: "regulation",
              year: r.starts_on,
            };
          }),
    },
    {
      name: "Federal Register",
      request: (q, limit) => ({
        url:
          `https://www.federalregister.gov/api/v1/documents.json?per_page=${limit}&order=relevance` +
          `&conditions%5Bterm%5D=${enc(q)}` +
          ["title", "type", "abstract", "html_url", "publication_date", "document_number"]
            .map((f) => `&fields%5B%5D=${f}`)
            .join(""),
      }),
      parse: (body, limit) =>
        take(body, "results", limit).map((r) => ({
          title: r.title,
          description: r.abstract ?? "",
          reference: `FR Doc. ${r.document_number}`,
          url: r.html_url,
          type: String(r.type ?? "").toLowerCase(),
          year: r.publication_date,
        })),
    },
  ],
});

const GOVINFO_COLLECTIONS: Record<string, string> = {
  uscode: "USCODE",
  public_laws: "PLAW",
  bills: "BILLS",
  cfr: "CFR",
};

/** US Code, public laws and bills: GovInfo full-text search (api.data.gov key; DEMO_KEY works at low volume). */
export const handleUsCode = createJurisdictionHandler({
  toolName: "legal_search_us_code",
  displayName: "GovInfo (US Code, public laws, bills)",
  source: "GovInfo API (api.govinfo.gov)",
  indexedLaws: [],
  searchUrl: (q) => `https://www.govinfo.gov/app/search/${enc(JSON.stringify({ query: q }))}`,
  liveSearches: [
    {
      name: "GovInfo",
      request: (q, limit, args) => {
        const key = typeof args.collection === "string" ? GOVINFO_COLLECTIONS[args.collection] : undefined;
        const collection = key ?? "USCODE OR PLAW OR BILLS";
        return {
          url: `https://api.govinfo.gov/search?api_key=${enc(process.env.GOVINFO_API_KEY || "DEMO_KEY")}`,
          init: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `${q} collection:(${collection})`,
              pageSize: limit,
              offsetMark: "*",
              sorts: [{ field: "score", sortOrder: "DESC" }],
            }),
          },
        };
      },
      parse: (body, limit) =>
        take(body, "results", limit).map((r) => ({
          title: r.title,
          reference: r.granuleId ?? r.packageId,
          url: `https://www.govinfo.gov/app/details/${r.packageId}${r.granuleId ? `/${r.granuleId}` : ""}`,
          type: r.collectionCode,
          year: r.dateIssued,
        })),
    },
  ],
});

/** State legislation in all 50 states, DC and Puerto Rico: Open States (free key required). */
export const handleUsStates = createJurisdictionHandler({
  toolName: "legal_search_us_states",
  displayName: "Open States (state legislation)",
  source: "Open States API v3 (v3.openstates.org)",
  indexedLaws: [],
  searchUrl: (q) => `https://openstates.org/search/?query=${enc(q)}`,
  requiredEnv: { name: "OPENSTATES_API_KEY", signupUrl: "https://openstates.org/accounts/signup/" },
  liveSearches: [
    {
      name: "Open States",
      request: (q, limit, args) => {
        const state = typeof args.state === "string" && args.state.trim() ? `&jurisdiction=${enc(args.state.trim().toLowerCase())}` : "";
        return {
          url: `https://v3.openstates.org/bills?q=${enc(q)}${state}&per_page=${Math.min(limit, 20)}&sort=latest_action_desc`,
          init: { headers: { "X-API-KEY": process.env.OPENSTATES_API_KEY ?? "" } },
        };
      },
      parse: (body, limit) =>
        take(body, "results", limit).map((r) => ({
          title: `${r.jurisdiction?.name ?? ""} ${r.identifier}: ${r.title}`.trim(),
          description: r.latest_action_description ? `Latest action: ${r.latest_action_description}` : "",
          reference: `${r.identifier} (session ${r.session})`,
          url: r.openstates_url,
          type: "state bill",
          year: r.latest_action_date,
        })),
    },
  ],
});

/** Federal and state court opinions: CourtListener (free token required). */
export const handleUsCaselaw = createJurisdictionHandler({
  toolName: "legal_search_us_caselaw",
  displayName: "CourtListener (US case law)",
  source: "CourtListener API v4 (courtlistener.com)",
  indexedLaws: [],
  searchUrl: (q) => `https://www.courtlistener.com/?q=${enc(q)}`,
  requiredEnv: { name: "COURTLISTENER_API_TOKEN", signupUrl: "https://www.courtlistener.com/sign-in/" },
  liveSearches: [
    {
      name: "CourtListener",
      request: (q, _limit, args) => {
        const court = typeof args.court === "string" && args.court.trim() ? `&court=${enc(args.court.trim())}` : "";
        return {
          url: `https://www.courtlistener.com/api/rest/v4/search/?type=o&q=${enc(q)}${court}`,
          init: { headers: { Authorization: `Token ${process.env.COURTLISTENER_API_TOKEN ?? ""}` } },
        };
      },
      parse: (body, limit) =>
        take(body, "results", limit).map((r) => ({
          title: r.caseName,
          description: stripHtml(r.opinions?.[0]?.snippet),
          reference: [r.court, ...(Array.isArray(r.citation) ? r.citation : [])].filter(Boolean).join(" · "),
          url: `https://www.courtlistener.com${r.absolute_url}`,
          type: "opinion",
          year: r.dateFiled,
        })),
    },
  ],
});
