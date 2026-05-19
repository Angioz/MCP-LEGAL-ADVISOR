/**
 * Paraguay Open Data (datos.gov.py) Integration Tool
 * Queries Paraguayan government open data portal (DKAN-based)
 *
 * Portal: https://www.datos.gov.py
 * Platform: DKAN (Drupal-based open data)
 */

import type { ToolSuccessResponse, ToolErrorResponse } from "../types.js";

const PORTAL_URL = "https://www.datos.gov.py";

export interface ParaguayOpenDataArgs {
  query: string;
  organization?: string;
  limit?: number;
}

interface DkanDataset {
  title?: string;
  description?: string;
  identifier?: string;
  modified?: string;
  publisher?: { name?: string };
  distribution?: Array<{
    title?: string;
    format?: string;
    downloadURL?: string;
    accessURL?: string;
  }>;
  keyword?: string[];
  [key: string]: unknown;
}

interface DkanSearchResponse {
  dataset?: DkanDataset[];
  [key: string]: unknown;
}

function formatDataset(
  ds: DkanDataset
): Record<string, unknown> {
  return {
    title: ds.title || "Untitled",
    description: (ds.description || "").substring(0, 500),
    identifier: ds.identifier,
    publisher: ds.publisher?.name,
    modified: ds.modified,
    keywords: ds.keyword,
    resources: ds.distribution?.slice(0, 5).map((r) => ({
      title: r.title,
      format: r.format,
      url: r.downloadURL || r.accessURL,
    })),
  };
}

async function searchDkan(
  query: string,
  limit: number
): Promise<{ datasets: DkanDataset[]; totalCount: number }> {
  // DKAN exposes a data.json endpoint (Project Open Data standard)
  // and sometimes a CKAN-compatible API
  const urls = [
    `${PORTAL_URL}/api/1/search/dataset?fulltext=${encodeURIComponent(query)}&limit=${limit}`,
    `${PORTAL_URL}/api/3/action/package_search?q=${encodeURIComponent(query)}&rows=${limit}`,
    `${PORTAL_URL}/api/dataset?query=${encodeURIComponent(query)}`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "LegalKnowledgeMCP/1.0",
        },
      });

      if (!response.ok) continue;

      const data = await response.json();

      // DKAN v1 search response
      if (data && typeof data === "object") {
        // CKAN-compatible format
        if ("result" in data && (data as Record<string, unknown>).result) {
          const result = (data as { result: { results: DkanDataset[]; count: number } }).result;
          return { datasets: result.results || [], totalCount: result.count || 0 };
        }
        // DKAN dataset array format
        if (Array.isArray(data)) {
          return { datasets: data as DkanDataset[], totalCount: (data as DkanDataset[]).length };
        }
        // data.json / Project Open Data format
        if ("dataset" in data) {
          const resp = data as DkanSearchResponse;
          const datasets = resp.dataset || [];
          const filtered = datasets.filter(
            (ds) =>
              (ds.title || "").toLowerCase().includes(query.toLowerCase()) ||
              (ds.description || "").toLowerCase().includes(query.toLowerCase())
          );
          return { datasets: filtered.slice(0, limit), totalCount: filtered.length };
        }
      }
    } catch {
      continue;
    }
  }

  return { datasets: [], totalCount: 0 };
}

export async function handleParaguayOpenData(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_query_paraguay_opendata";
  const input = args as unknown as ParaguayOpenDataArgs;

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
    const { datasets, totalCount } = await searchDkan(input.query, limit);

    let filtered = datasets;
    if (input.organization) {
      const orgLower = input.organization.toLowerCase();
      filtered = datasets.filter((ds) =>
        (ds.publisher?.name || "").toLowerCase().includes(orgLower)
      );
    }

    const results = filtered.slice(0, limit).map(formatDataset);

    return {
      status: "success",
      tool: toolName,
      source: "datos.gov.py - Portal de Datos Abiertos del Paraguay",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query,
        organization_filter: input.organization || null,
        total_count: totalCount,
        returned_count: results.length,
        results,
        portal_url: PORTAL_URL,
        note:
          results.length === 0
            ? `No results for "${input.query}". Browse datasets at ${PORTAL_URL}`
            : undefined,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to query Paraguay Open Data: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}
