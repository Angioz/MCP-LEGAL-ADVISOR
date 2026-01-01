/**
 * dati.gov.it CKAN Integration Tool
 * Queries Italian open data catalog via CKAN API v3
 *
 * API Docs: https://www.dati.gov.it/api
 * Base URL: https://www.dati.gov.it/api/3/action/
 */

import { getSourceConfig, isSourceEnabled } from "../config/index.js";
import type { DatiGovQueryArgs, ToolSuccessResponse, ToolErrorResponse } from "../types.js";

/**
 * Dataset structure from dati.gov.it CKAN API
 */
interface DatigovDataset {
  id: string;
  name: string;
  title: string;
  notes?: string;
  organization?: {
    name: string;
    title: string;
  };
  tags?: Array<{ name: string }>;
  resources?: Array<{
    id: string;
    name: string;
    format: string;
    url: string;
    description?: string;
  }>;
  metadata_modified?: string;
  license_title?: string;
}

/**
 * Search response from CKAN API
 */
interface CkanSearchResponse {
  success: boolean;
  result: {
    count: number;
    results: DatigovDataset[];
  };
}

/**
 * Format dataset for response
 */
function formatDataset(ds: DatigovDataset): Record<string, unknown> {
  return {
    id: ds.id,
    name: ds.name,
    title: ds.title,
    description: ds.notes?.substring(0, 500),
    organization: ds.organization?.title,
    license: ds.license_title,
    tags: ds.tags?.map(t => t.name),
    resources: ds.resources?.slice(0, 5).map(r => ({
      name: r.name || r.description,
      format: r.format,
      url: r.url,
    })),
    last_modified: ds.metadata_modified,
  };
}

/**
 * Handle dati.gov.it tool calls
 */
export async function handleDatigov(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_query_datigov";

  // Check if source is enabled
  if (!isSourceEnabled("datigov")) {
    return {
      status: "error",
      tool: toolName,
      error: "dati.gov.it source is disabled in configuration",
      code: "SOURCE_DISABLED",
    };
  }

  const input = args as unknown as DatiGovQueryArgs;

  // Validate required arguments
  if (!input.query) {
    return {
      status: "error",
      tool: toolName,
      error: "The 'query' parameter is required",
      code: "INVALID_ARGUMENTS",
    };
  }

  try {
    const config = getSourceConfig("datigov");
    const baseUrl = config.base_url!;

    // Build search URL with parameters
    const params = new URLSearchParams();
    params.set("q", input.query);
    params.set("rows", "10"); // Limit results

    // Add organization filter if provided
    if (input.organization) {
      params.set("fq", `organization:${input.organization}`);
    }

    const searchUrl = `${baseUrl}package_search?${params.toString()}`;

    const response = await fetch(searchUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        status: "error",
        tool: toolName,
        error: `dati.gov.it API error: ${response.status} ${response.statusText}`,
        code: "API_ERROR",
        details: {
          status: response.status,
          body: errorText.substring(0, 500),
        },
      };
    }

    const data = await response.json() as CkanSearchResponse;

    if (!data.success) {
      return {
        status: "error",
        tool: toolName,
        error: "dati.gov.it API returned unsuccessful response",
        code: "API_ERROR",
      };
    }

    const results = data.result.results.map(formatDataset);

    return {
      status: "success",
      tool: toolName,
      source: "dati.gov.it",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query,
        organization_filter: input.organization || null,
        total_count: data.result.count,
        returned_count: results.length,
        results,
        pagination: {
          returned: results.length,
          total: data.result.count,
          has_more: data.result.count > results.length,
        },
      },
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to query dati.gov.it: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}
