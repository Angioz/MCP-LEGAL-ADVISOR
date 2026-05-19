/**
 * German Laws (Gesetze im Internet) Integration Tool
 * Queries German federal legislation
 *
 * Source: https://www.gesetze-im-internet.de
 * Alternative API: https://github.com/tech4germany/rechtsinfo_api
 */

import type { ToolSuccessResponse, ToolErrorResponse } from "../types.js";
import { searchIndexedLaws } from "../utils/keyword-search.js";
import { GERMANY_LAWS } from "../data/indexed-laws.js";

const BASE_URL = "https://www.gesetze-im-internet.de";

/**
 * Arguments for German legislation queries
 */
export interface GermanyLawArgs {
  query: string;
  law_code?: string; // e.g., "GmbHG", "HGB", "BGB"
  limit?: number;
}

/**
 * Result structure for German legislation queries
 */
interface GermanyLawResult {
  title: string;
  abbreviation: string;
  full_title: string;
  url: string;
  english_url?: string;
}

/**
 * Pre-indexed important German laws
 * These provide reliable access to major legislation
 */
const INDEXED_LAWS: Record<string, GermanyLawResult[]> = {
  gmbh: [
    {
      title: "Gesetz betreffend die Gesellschaften mit beschränkter Haftung (GmbHG)",
      abbreviation: "GmbHG",
      full_title: "GmbH-Gesetz",
      url: "https://www.gesetze-im-internet.de/gmbhg/",
      english_url: "https://www.gesetze-im-internet.de/englisch_gmbhg/",
    },
  ],
  hgb: [
    {
      title: "Handelsgesetzbuch (HGB)",
      abbreviation: "HGB",
      full_title: "Commercial Code",
      url: "https://www.gesetze-im-internet.de/hgb/",
      english_url: "https://www.gesetze-im-internet.de/englisch_hgb/",
    },
  ],
  bgb: [
    {
      title: "Bürgerliches Gesetzbuch (BGB)",
      abbreviation: "BGB",
      full_title: "Civil Code",
      url: "https://www.gesetze-im-internet.de/bgb/",
      english_url: "https://www.gesetze-im-internet.de/englisch_bgb/",
    },
  ],
  aktg: [
    {
      title: "Aktiengesetz (AktG)",
      abbreviation: "AktG",
      full_title: "Stock Corporation Act",
      url: "https://www.gesetze-im-internet.de/aktg/",
      english_url: "https://www.gesetze-im-internet.de/englisch_aktg/",
    },
  ],
  gg: [
    {
      title: "Grundgesetz für die Bundesrepublik Deutschland (GG)",
      abbreviation: "GG",
      full_title: "Basic Law for the Federal Republic of Germany",
      url: "https://www.gesetze-im-internet.de/gg/",
      english_url: "https://www.gesetze-im-internet.de/englisch_gg/",
    },
  ],
  ustg: [
    {
      title: "Umsatzsteuergesetz (UStG)",
      abbreviation: "UStG",
      full_title: "Value Added Tax Act",
      url: "https://www.gesetze-im-internet.de/ustg_1980/",
    },
  ],
  estg: [
    {
      title: "Einkommensteuergesetz (EStG)",
      abbreviation: "EStG",
      full_title: "Income Tax Act",
      url: "https://www.gesetze-im-internet.de/estg/",
    },
  ],
  bdsg: [
    {
      title: "Bundesdatenschutzgesetz (BDSG)",
      abbreviation: "BDSG",
      full_title: "Federal Data Protection Act",
      url: "https://www.gesetze-im-internet.de/bdsg_2018/",
      english_url: "https://www.gesetze-im-internet.de/englisch_bdsg/",
    },
  ],
  arbzg: [
    {
      title: "Arbeitszeitgesetz (ArbZG)",
      abbreviation: "ArbZG",
      full_title: "Working Hours Act",
      url: "https://www.gesetze-im-internet.de/arbzg/",
    },
  ],
  startup: [
    {
      title: "GmbH-Gesetz (relevant for German startups)",
      abbreviation: "GmbHG",
      full_title: "Limited Liability Company Act",
      url: "https://www.gesetze-im-internet.de/gmbhg/",
      english_url: "https://www.gesetze-im-internet.de/englisch_gmbhg/",
    },
    {
      title: "Handelsgesetzbuch (Commercial Code)",
      abbreviation: "HGB",
      full_title: "Commercial Code",
      url: "https://www.gesetze-im-internet.de/hgb/",
      english_url: "https://www.gesetze-im-internet.de/englisch_hgb/",
    },
  ],
  company: [
    {
      title: "GmbH-Gesetz",
      abbreviation: "GmbHG",
      full_title: "Limited Liability Company Act",
      url: "https://www.gesetze-im-internet.de/gmbhg/",
      english_url: "https://www.gesetze-im-internet.de/englisch_gmbhg/",
    },
    {
      title: "Aktiengesetz",
      abbreviation: "AktG",
      full_title: "Stock Corporation Act",
      url: "https://www.gesetze-im-internet.de/aktg/",
      english_url: "https://www.gesetze-im-internet.de/englisch_aktg/",
    },
  ],
  tax: [
    {
      title: "Einkommensteuergesetz",
      abbreviation: "EStG",
      full_title: "Income Tax Act",
      url: "https://www.gesetze-im-internet.de/estg/",
    },
    {
      title: "Umsatzsteuergesetz",
      abbreviation: "UStG",
      full_title: "Value Added Tax Act",
      url: "https://www.gesetze-im-internet.de/ustg_1980/",
    },
  ],
  data_protection: [
    {
      title: "Bundesdatenschutzgesetz (BDSG)",
      abbreviation: "BDSG",
      full_title: "Federal Data Protection Act",
      url: "https://www.gesetze-im-internet.de/bdsg_2018/",
      english_url: "https://www.gesetze-im-internet.de/englisch_bdsg/",
    },
  ],
};

/**
 * Handle German legislation tool calls
 */
export async function handleGermany(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_search_germany";

  // Validate required arguments
  const input = args as unknown as GermanyLawArgs;
  if (!input.query) {
    return {
      status: "error",
      tool: toolName,
      error: "The 'query' parameter is required",
      code: "INVALID_ARGUMENTS",
    };
  }

  try {
    const limit = input.limit || 10;
    const queryLower = input.query.toLowerCase();

    // Layer 1: Multilingual fuzzy search on comprehensive indexed laws
    const indexedMatches = searchIndexedLaws(GERMANY_LAWS, input.query, undefined, limit);
    let results: GermanyLawResult[] = indexedMatches.map(l => ({
      title: l.law_ref,
      full_title: l.title,
      abbreviation: l.law_ref,
      url: l.url,
      description: l.description,
      english_available: false,
    }));

    // Layer 1b: Also check legacy INDEXED_LAWS
    if (input.law_code) {
      const codeLower = input.law_code.toLowerCase();
      if (INDEXED_LAWS[codeLower]) {
        for (const law of INDEXED_LAWS[codeLower]) {
          if (!results.some((r) => r.url === law.url)) {
            results.push(law);
          }
        }
      }
    }

    for (const [key, laws] of Object.entries(INDEXED_LAWS)) {
      if (
        queryLower.includes(key) ||
        key.includes(queryLower) ||
        laws.some(
          (l) =>
            l.title.toLowerCase().includes(queryLower) ||
            l.abbreviation.toLowerCase().includes(queryLower) ||
            l.full_title.toLowerCase().includes(queryLower)
        )
      ) {
        for (const law of laws) {
          if (!results.some((r) => r.url === law.url)) {
            results.push(law);
          }
        }
      }
    }

    // If no pre-indexed results, provide search guidance
    if (results.length === 0) {
      results = await searchGesetzeImInternet(input.query, limit);
    }

    // Limit results
    results = results.slice(0, limit);

    return {
      status: "success",
      tool: toolName,
      source: "Gesetze im Internet (German Federal Laws)",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query,
        law_code: input.law_code || null,
        result_count: results.length,
        results,
        search_url: `${BASE_URL}/Teilliste_A.html`,
        note:
          results.length === 0
            ? `No indexed results for "${input.query}". Browse all German federal laws at ${BASE_URL}`
            : "Many German laws have English translations available (see english_url field).",
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to query German legislation: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Search Gesetze im Internet
 * The site doesn't have a proper search API, so we use the alphabetical index
 */
async function searchGesetzeImInternet(query: string, limit: number): Promise<GermanyLawResult[]> {
  try {
    // Get the first letter index page
    const firstLetter = query.charAt(0).toUpperCase();
    const indexUrl = `${BASE_URL}/Teilliste_${firstLetter}.html`;

    const response = await fetch(indexUrl, {
      headers: {
        Accept: "text/html",
        "User-Agent": "LegalKnowledgeMCP/1.0",
      },
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    return parseGesetzeResults(html, query, limit);
  } catch {
    return [];
  }
}

/**
 * Parse results from Gesetze im Internet HTML
 */
function parseGesetzeResults(html: string, query: string, limit: number): GermanyLawResult[] {
  const results: GermanyLawResult[] = [];
  const queryLower = query.toLowerCase();

  // Match law links - format: <a href="/lawcode/">Abbreviation - Full Title</a>
  const linkRegex = /<a[^>]*href="\/([^"\/]+)\/"[^>]*>([^<]+)<\/a>/gi;

  let match;
  while ((match = linkRegex.exec(html)) !== null && results.length < limit) {
    const code = match[1];
    const text = match[2].trim();

    // Check if this result matches the query
    if (text.toLowerCase().includes(queryLower) || code.toLowerCase().includes(queryLower)) {
      // Parse abbreviation and title
      const parts = text.split(" - ");
      const abbreviation = parts[0]?.trim() || code.toUpperCase();
      const title = parts.slice(1).join(" - ").trim() || text;

      results.push({
        title: text,
        abbreviation,
        full_title: title,
        url: `${BASE_URL}/${code}/`,
      });
    }
  }

  return results;
}
