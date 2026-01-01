/**
 * AADE (Greek Tax Authority) Integration Tool
 * Searches Greek tax guidance, circulars, and procedures
 *
 * Base URL: https://www.aade.gr
 * English section: /en/
 * Greek section: /
 */

import { getSourceConfig, isSourceEnabled } from "../config/index.js";
import type { AadeSearchArgs, ToolSuccessResponse, ToolErrorResponse } from "../types.js";

/**
 * Result structure for AADE queries
 */
interface AadeResult {
  title: string;
  url: string;
  date?: string;
  language: string;
  document_type: string;
  pdf_url?: string;
  summary?: string;
}

/**
 * Pre-indexed key documents for common Greek tax/business queries
 * These are authoritative sources that don't change frequently
 */
const KNOWN_DOCUMENTS: Record<string, AadeResult> = {
  efka_ike: {
    title: "EFKA Contributions for IKE Administrators",
    url: "https://www.aade.gr/en/businesses",
    language: "en",
    document_type: "guidance",
    summary:
      "IKE administrator must register with EFKA (former IKA). Monthly contribution approximately €156 (2024 rates). Registration required within 1 month of appointment.",
  },
  efka_contributions: {
    title: "EFKA Social Security Contribution Rates",
    url: "https://www.efka.gov.gr/en",
    language: "en",
    document_type: "rates",
    summary:
      "EFKA manages Greek social security. Self-employed pay 20.28% of declared income. Employees: 15.33% employer + 13.87% employee contributions.",
  },
  ike_formation: {
    title: "IKE (Private Company) Formation in Greece",
    url: "https://www.businessportal.gr/en/i-want-to-start-a-new-company/",
    language: "en",
    document_type: "procedure",
    summary:
      "IKE requires minimum €1 capital, 1+ shareholders, registered office in Greece. Formation via One-Stop Shop or notary. GEMI registration mandatory.",
  },
  ike_closure: {
    title: "IKE Dissolution Procedure",
    url: "https://www.businessportal.gr/en/i-want-to-close-down-my-company/",
    language: "en",
    document_type: "procedure",
    summary:
      "IKE dissolution requires: shareholder resolution, GEMI notification, tax clearance from AADE, EFKA clearance, liquidation period (min 3 months).",
  },
  digital_nomad_visa: {
    title: "Digital Nomad Visa Greece",
    url: "https://www.migration.gov.gr/en/digital-nomad-visa/",
    language: "en",
    document_type: "visa",
    summary:
      "Non-EU remote workers can apply for 12-month visa (renewable). Requirements: €3,500/month income, health insurance, remote employment proof.",
  },
  tax_residency: {
    title: "Greek Tax Residency Rules",
    url: "https://www.aade.gr/en/individuals",
    language: "en",
    document_type: "guidance",
    summary:
      "Tax resident if: 183+ days in Greece, or vital interests center in Greece. Non-dom regime available for qualifying individuals (flat tax on foreign income).",
  },
  vat_registration: {
    title: "VAT Registration in Greece",
    url: "https://www.aade.gr/en/businesses/vat",
    language: "en",
    document_type: "procedure",
    summary:
      "VAT registration mandatory for businesses. Standard rate 24%, reduced rates 13% and 6%. Intra-EU supplies may be zero-rated.",
  },
};

/**
 * Topic-specific document mappings
 */
const TOPIC_DOCUMENTS: Record<string, string[]> = {
  efka: ["efka_ike", "efka_contributions"],
  ike: ["ike_formation", "ike_closure", "efka_ike"],
  income_tax: ["tax_residency"],
  vat: ["vat_registration"],
  all: Object.keys(KNOWN_DOCUMENTS),
};

/**
 * Search known documents by query
 */
function searchKnownDocuments(query: string, topic?: string): AadeResult[] {
  const queryLower = query.toLowerCase();
  const topicDocs = topic && topic !== "all" ? TOPIC_DOCUMENTS[topic] || [] : Object.keys(KNOWN_DOCUMENTS);

  return topicDocs
    .map((key) => KNOWN_DOCUMENTS[key])
    .filter((doc) => {
      if (!doc) return false;
      return (
        doc.title.toLowerCase().includes(queryLower) ||
        doc.summary?.toLowerCase().includes(queryLower) ||
        doc.document_type.toLowerCase().includes(queryLower)
      );
    });
}

/**
 * Fetch and parse AADE search results
 * Note: AADE website structure varies; this provides best-effort parsing
 */
async function searchAadeWebsite(
  baseUrl: string,
  query: string,
  language: string
): Promise<AadeResult[]> {
  const langPath = language === "en" ? "/en" : "";

  // AADE uses different search mechanisms; try the main search
  const searchUrl = `${baseUrl}${langPath}/search?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LegalKnowledgeMCP/1.0)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": language === "en" ? "en-US,en;q=0.9" : "el-GR,el;q=0.9",
      },
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const results: AadeResult[] = [];

    // Simple HTML parsing for search results
    // Note: A production implementation would use cheerio or similar
    // For now, we extract links and titles using regex patterns

    // Look for result items (common patterns in government sites)
    const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    let match;
    const seen = new Set<string>();

    while ((match = linkPattern.exec(html)) !== null && results.length < 10) {
      const [, href, title] = match;

      // Filter to relevant results (not navigation, etc.)
      if (
        href &&
        title &&
        title.length > 10 &&
        !seen.has(href) &&
        (href.includes("/egkyklioi/") ||
          href.includes("/apofaseis/") ||
          href.includes("/businesses/") ||
          href.includes("/individuals/") ||
          href.includes(".pdf"))
      ) {
        seen.add(href);
        const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;

        results.push({
          title: title.trim(),
          url: fullUrl,
          language,
          document_type: href.includes(".pdf") ? "pdf" : "webpage",
          pdf_url: href.includes(".pdf") ? fullUrl : undefined,
        });
      }
    }

    return results;
  } catch (error) {
    // Network errors are handled gracefully
    return [];
  }
}

/**
 * Handle AADE tool calls
 */
export async function handleAade(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_search_aade";

  // Check if source is enabled
  if (!isSourceEnabled("aade")) {
    return {
      status: "error",
      tool: toolName,
      error: "AADE source is disabled in configuration",
      code: "SOURCE_DISABLED",
    };
  }

  // Validate required arguments
  const input = args as unknown as AadeSearchArgs;
  if (!input.query) {
    return {
      status: "error",
      tool: toolName,
      error: "'query' parameter is required",
      code: "INVALID_ARGUMENTS",
    };
  }

  try {
    const config = getSourceConfig("aade");
    const baseUrl = config.base_url!;

    // First, search pre-indexed known documents
    const knownResults = searchKnownDocuments(input.query, input.topic);

    if (knownResults.length > 0) {
      return {
        status: "success",
        tool: toolName,
        source: "AADE Greece (Pre-indexed)",
        timestamp: new Date().toISOString(),
        data: {
          query: input.query,
          topic: input.topic || "all",
          action: "known_documents",
          result_count: knownResults.length,
          results: knownResults,
          note: "Results from pre-indexed authoritative documents. For latest info, verify on aade.gr",
        },
      };
    }

    // Try English search first
    let results = await searchAadeWebsite(baseUrl, input.query, "en");
    let language = "en";

    // Fall back to Greek if no English results
    if (results.length === 0) {
      results = await searchAadeWebsite(baseUrl, input.query, "el");
      language = "el";

      if (results.length > 0) {
        return {
          status: "success",
          tool: toolName,
          source: "AADE Greece",
          timestamp: new Date().toISOString(),
          data: {
            query: input.query,
            topic: input.topic || "all",
            action: "search",
            language: "el",
            result_count: results.length,
            results,
            note: "No English results found. Showing Greek results (may need translation).",
          },
        };
      }
    }

    // Return results (may be empty)
    return {
      status: "success",
      tool: toolName,
      source: "AADE Greece",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query,
        topic: input.topic || "all",
        action: "search",
        language,
        result_count: results.length,
        results,
        suggestion:
          results.length === 0
            ? "No results found. Try searching for: efka, ike, vat, tax residency, digital nomad"
            : undefined,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to search AADE: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}
