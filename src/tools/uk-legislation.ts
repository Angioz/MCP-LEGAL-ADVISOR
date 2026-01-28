/**
 * UK Legislation.gov.uk REST API Integration Tool
 * Queries UK legislation via the official REST API
 *
 * API Docs: https://www.legislation.gov.uk/developer
 * Base URL: https://www.legislation.gov.uk
 */

import type { ToolSuccessResponse, ToolErrorResponse } from "../types.js";

const BASE_URL = "https://www.legislation.gov.uk";

/**
 * Arguments for UK Legislation queries
 */
export interface UkLegislationArgs {
  query: string;
  type?: "ukpga" | "uksi" | "asp" | "all"; // UK Public General Acts, Statutory Instruments, etc.
  year?: number;
  limit?: number;
}

/**
 * Result structure for UK Legislation queries
 */
interface UkLegislationResult {
  title: string;
  type: string;
  year: string;
  number: string;
  url: string;
}

/**
 * Map legislation type codes to full names
 */
const TYPE_NAMES: Record<string, string> = {
  ukpga: "UK Public General Act",
  uksi: "UK Statutory Instrument",
  asp: "Act of Scottish Parliament",
  asc: "Act of Senedd Cymru",
  nia: "Northern Ireland Act",
  ukla: "UK Local Act",
};

/**
 * Handle UK Legislation tool calls
 */
export async function handleUkLegislation(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_search_uk";

  // Validate required arguments
  const input = args as unknown as UkLegislationArgs;
  if (!input.query) {
    return {
      status: "error",
      tool: toolName,
      error: "The 'query' parameter is required",
      code: "INVALID_ARGUMENTS",
    };
  }

  try {
    // Build search URL
    const limit = input.limit || 10;
    let searchUrl = `${BASE_URL}/search?text=${encodeURIComponent(input.query)}`;

    // Add type filter if specified
    if (input.type && input.type !== "all") {
      searchUrl += `&type=${input.type}`;
    }

    // Add year filter if specified
    if (input.year) {
      searchUrl += `&year=${input.year}`;
    }

    // Request JSON format using Atom feed with JSON content negotiation
    // legislation.gov.uk returns Atom XML by default, we'll parse it
    const response = await fetch(searchUrl, {
      headers: {
        Accept: "application/atom+xml",
        "User-Agent": "LegalKnowledgeMCP/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        status: "error",
        tool: toolName,
        error: `UK Legislation API error: ${response.status} ${response.statusText}`,
        code: "API_ERROR",
        details: {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500),
        },
      };
    }

    const xmlText = await response.text();

    // Parse Atom XML to extract results
    const results = parseAtomResults(xmlText, limit);

    return {
      status: "success",
      tool: toolName,
      source: "UK legislation.gov.uk",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query,
        type: input.type || "all",
        year: input.year || "all",
        result_count: results.length,
        results,
        search_url: searchUrl,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to query UK Legislation: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Parse Atom XML results from legislation.gov.uk
 */
function parseAtomResults(xml: string, limit: number): UkLegislationResult[] {
  const results: UkLegislationResult[] = [];

  // Simple regex-based XML parsing for Atom entries
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/;
  const linkRegex = /<link[^>]*href="([^"]+)"[^>]*\/>/;
  const idRegex = /<id>([^<]+)<\/id>/;

  let match;
  let count = 0;

  while ((match = entryRegex.exec(xml)) !== null && count < limit) {
    const entry = match[1];

    const titleMatch = entry.match(titleRegex);
    const linkMatch = entry.match(linkRegex);
    const idMatch = entry.match(idRegex);

    if (titleMatch || idMatch) {
      const url = linkMatch?.[1] || idMatch?.[1] || "";

      // Extract type and year from URL pattern like /ukpga/2018/12
      const urlParts = url.match(/\/([a-z]+)\/(\d{4})\/(\d+)/);

      results.push({
        title: decodeHtmlEntities(titleMatch?.[1] || ""),
        type: urlParts?.[1] ? TYPE_NAMES[urlParts[1]] || urlParts[1] : "Unknown",
        year: urlParts?.[2] || "",
        number: urlParts?.[3] || "",
        url: url.startsWith("http") ? url : `${BASE_URL}${url}`,
      });

      count++;
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
    .replace(/<[^>]+>/g, ""); // Strip any remaining HTML tags
}
