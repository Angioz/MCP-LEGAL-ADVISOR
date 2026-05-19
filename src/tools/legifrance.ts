/**
 * Légifrance REST API Integration Tool
 * Queries French legislation via the PISTE API
 *
 * API Docs: https://piste.gouv.fr/
 * Note: Requires free registration for API access
 *
 * For now, this implementation uses the public search interface
 * and can be upgraded to use the PISTE API when credentials are available.
 */

import type { ToolSuccessResponse, ToolErrorResponse } from "../types.js";
import { searchIndexedLaws } from "../utils/keyword-search.js";
import { FRANCE_LAWS } from "../data/indexed-laws.js";

const BASE_URL = "https://www.legifrance.gouv.fr";

/**
 * Arguments for Légifrance queries
 */
export interface LegifranceArgs {
  query: string;
  type?: "loi" | "ordonnance" | "decret" | "arrete" | "code" | "all";
  date_from?: string; // YYYY-MM-DD format
  date_to?: string;
  limit?: number;
}

/**
 * Result structure for Légifrance queries
 */
interface LegifranceResult {
  title: string;
  type: string;
  date: string;
  reference: string;
  url: string;
}

/**
 * Map type codes to French legislation types
 */
const TYPE_NAMES: Record<string, string> = {
  loi: "Loi",
  ordonnance: "Ordonnance",
  decret: "Décret",
  arrete: "Arrêté",
  code: "Code",
};

/**
 * Pre-indexed important French legal texts
 * These provide reliable access to key legislation
 */
const INDEXED_TEXTS: Record<string, LegifranceResult[]> = {
  code_commerce: [
    {
      title: "Code de commerce",
      type: "Code",
      date: "2000-09-18",
      reference: "LEGIARTI000006219162",
      url: "https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000005634379",
    },
  ],
  code_travail: [
    {
      title: "Code du travail",
      type: "Code",
      date: "2008-05-01",
      reference: "LEGITEXT000006072050",
      url: "https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006072050",
    },
  ],
  code_civil: [
    {
      title: "Code civil",
      type: "Code",
      date: "1804-03-21",
      reference: "LEGITEXT000006070721",
      url: "https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070721",
    },
  ],
  gdpr: [
    {
      title: "Loi n° 78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés (RGPD/GDPR France)",
      type: "Loi",
      date: "1978-01-06",
      reference: "JORFTEXT000000886460",
      url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000886460",
    },
  ],
  startup: [
    {
      title: "Loi n° 2019-486 du 22 mai 2019 relative à la croissance et la transformation des entreprises (PACTE)",
      type: "Loi",
      date: "2019-05-22",
      reference: "JORFTEXT000038496102",
      url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038496102",
    },
  ],
  societe: [
    {
      title: "Loi n° 66-537 du 24 juillet 1966 sur les sociétés commerciales",
      type: "Loi",
      date: "1966-07-24",
      reference: "LEGITEXT000006068725",
      url: "https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006068725",
    },
  ],
};

/**
 * Handle Légifrance tool calls
 */
export async function handleLegifrance(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_search_france";

  // Validate required arguments
  const input = args as unknown as LegifranceArgs;
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

    // Layer 1: Multilingual fuzzy search
    const indexedMatches = searchIndexedLaws(FRANCE_LAWS, input.query, undefined, limit);
    let results: LegifranceResult[] = indexedMatches.map(l => ({
      title: l.title,
      type: l.topic,
      date: "",
      reference: l.law_ref,
      url: l.url,
    }));

    // Layer 1b: Also check legacy INDEXED_TEXTS
    for (const [key, texts] of Object.entries(INDEXED_TEXTS)) {
      if (queryLower.includes(key.replace(/_/g, " ")) || key.includes(queryLower.replace(/ /g, "_"))) {
        for (const t of texts) {
          if (!results.some(r => r.title === t.title)) {
            results.push(t);
          }
        }
      }
    }

    // Layer 2: Live search if no results yet
    if (results.length === 0) {
      results = await searchLegifrance(input.query, input.type, limit);
    }

    // Apply type filter if specified
    if (input.type && input.type !== "all") {
      const typeName = TYPE_NAMES[input.type];
      results = results.filter((r) => r.type.toLowerCase().includes(input.type!) || r.type === typeName);
    }

    // Limit results
    results = results.slice(0, limit);

    return {
      status: "success",
      tool: toolName,
      source: "Légifrance",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query,
        type: input.type || "all",
        result_count: results.length,
        results,
        note:
          results.length === 0
            ? "No results found. For comprehensive access, register at piste.gouv.fr for the official API."
            : undefined,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to query Légifrance: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Search Légifrance public interface
 */
async function searchLegifrance(
  query: string,
  type: string | undefined,
  limit: number
): Promise<LegifranceResult[]> {
  try {
    // Use Légifrance search page
    const searchUrl = `${BASE_URL}/search/all?tab_selection=all&query=${encodeURIComponent(query)}&searchField=ALL&isAdvancedResult=true&sortValue=PERTINENCE`;

    const response = await fetch(searchUrl, {
      headers: {
        Accept: "text/html",
        "User-Agent": "LegalKnowledgeMCP/1.0",
      },
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();

    // Parse search results from HTML
    return parseLegifranceResults(html, limit);
  } catch {
    return [];
  }
}

/**
 * Parse Légifrance search results from HTML
 */
function parseLegifranceResults(html: string, limit: number): LegifranceResult[] {
  const results: LegifranceResult[] = [];

  // Simple regex to extract result items
  // Légifrance uses specific HTML structure for results
  const resultRegex = /<a[^>]*href="([^"]*(?:loda|jorf|codes)[^"]*)"[^>]*>\s*<span[^>]*>([^<]+)<\/span>/gi;

  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < limit) {
    const url = match[1];
    const title = match[2].trim();

    if (title && url) {
      // Determine type from URL
      let docType = "Document";
      if (url.includes("/codes/")) docType = "Code";
      else if (url.includes("/loda/")) docType = "Loi/Décret";
      else if (url.includes("/jorf/")) docType = "Journal Officiel";

      results.push({
        title: decodeHtmlEntities(title),
        type: docType,
        date: "",
        reference: url.split("/").pop() || "",
        url: url.startsWith("http") ? url : `${BASE_URL}${url}`,
      });
    }
  }

  return results;
}

/**
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "");
}
