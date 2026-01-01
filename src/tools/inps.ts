/**
 * INPS OpenData Integration Tool
 * Queries Italian social security data via CKAN-compatible API
 *
 * API Docs: https://www.inps.it/it/it/dati-e-bilanci/open-data/api-inps.html
 * Base URL: https://serviziweb2.inps.it/odapi/
 */

import { getSourceConfig, isSourceEnabled } from "../config/index.js";
import type { InpsQueryArgs, ToolSuccessResponse, ToolErrorResponse } from "../types.js";

/**
 * Simple in-memory cache for INPS datasets (they don't change frequently)
 */
const cache: Map<string, { data: unknown; expires: number }> = new Map();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown, ttlMs: number): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

/**
 * Dataset metadata structure from INPS API
 */
interface InpsDataset {
  id: string;
  name: string;
  title: string;
  notes?: string;
  organization?: {
    name: string;
    title: string;
  };
  resources?: Array<{
    id: string;
    name: string;
    format: string;
    url: string;
  }>;
  tags?: Array<{ name: string }>;
  metadata_modified?: string;
}

/**
 * Fetch the list of all available datasets
 */
async function fetchDatasetList(baseUrl: string): Promise<string[]> {
  const cacheKey = "inps_dataset_list";
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${baseUrl}package_list`);
  if (!response.ok) {
    throw new Error(`INPS API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error("INPS API returned unsuccessful response");
  }

  const result = data.result as string[];
  setCache(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hours
  return result;
}

/**
 * Fetch metadata for a specific dataset
 */
async function fetchDatasetMetadata(baseUrl: string, datasetId: string): Promise<InpsDataset | null> {
  const cacheKey = `inps_dataset_${datasetId}`;
  const cached = getCached<InpsDataset>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${baseUrl}package_show?id=${encodeURIComponent(datasetId)}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`INPS API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    return null;
  }

  const result = data.result as InpsDataset;
  setCache(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hours
  return result;
}

/**
 * Search datasets by keyword in title/notes
 * Fetches metadata and searches in title, notes, and tags
 */
async function searchDatasets(baseUrl: string, query: string, limit: number = 10): Promise<InpsDataset[]> {
  // Get all dataset IDs
  const allIds = await fetchDatasetList(baseUrl);
  const queryLower = query.toLowerCase();
  const results: InpsDataset[] = [];

  // Search through datasets (limit API calls to avoid rate limiting)
  // We'll check a sample of datasets to find matches
  const sampleSize = Math.min(allIds.length, 50);
  const sampleIds = allIds.slice(0, sampleSize);

  for (const id of sampleIds) {
    if (results.length >= limit) break;

    try {
      const metadata = await fetchDatasetMetadata(baseUrl, id);
      if (!metadata) continue;

      // Check if query matches title, notes, name, or tags
      const titleMatch = metadata.title?.toLowerCase().includes(queryLower);
      const notesMatch = metadata.notes?.toLowerCase().includes(queryLower);
      const nameMatch = metadata.name?.toLowerCase().includes(queryLower);
      const tagsMatch = metadata.tags?.some(t => t.name.toLowerCase().includes(queryLower));

      if (titleMatch || notesMatch || nameMatch || tagsMatch) {
        results.push(metadata);
      }
    } catch {
      // Skip datasets that fail to load
      continue;
    }
  }

  return results;
}

/**
 * Format dataset for response
 */
function formatDataset(ds: InpsDataset): Record<string, unknown> {
  return {
    id: ds.id,
    name: ds.name,
    title: ds.title,
    description: ds.notes?.substring(0, 500),
    organization: ds.organization?.title,
    tags: ds.tags?.map(t => t.name),
    resources: ds.resources?.map(r => ({
      name: r.name,
      format: r.format,
      url: r.url,
    })),
    last_modified: ds.metadata_modified,
  };
}

/**
 * Handle INPS tool calls
 */
export async function handleInps(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_query_inps";

  // Check if source is enabled
  if (!isSourceEnabled("inps")) {
    return {
      status: "error",
      tool: toolName,
      error: "INPS source is disabled in configuration",
      code: "SOURCE_DISABLED",
    };
  }

  const input = args as unknown as InpsQueryArgs;

  // Validate required arguments
  if (!input.query && !input.dataset) {
    return {
      status: "error",
      tool: toolName,
      error: "Either 'query' or 'dataset' parameter is required",
      code: "INVALID_ARGUMENTS",
    };
  }

  try {
    const config = getSourceConfig("inps");
    const baseUrl = config.base_url!;

    // If specific dataset requested, fetch it directly
    if (input.dataset) {
      const metadata = await fetchDatasetMetadata(baseUrl, input.dataset);

      if (!metadata) {
        return {
          status: "error",
          tool: toolName,
          error: `Dataset not found: ${input.dataset}`,
          code: "NOT_FOUND",
        };
      }

      return {
        status: "success",
        tool: toolName,
        source: "INPS OpenData",
        timestamp: new Date().toISOString(),
        data: {
          action: "get_dataset",
          dataset: formatDataset(metadata),
        },
      };
    }

    // Search datasets by query
    const results = await searchDatasets(baseUrl, input.query, 10);

    return {
      status: "success",
      tool: toolName,
      source: "INPS OpenData",
      timestamp: new Date().toISOString(),
      data: {
        action: "search",
        query: input.query,
        result_count: results.length,
        results: results.map(formatDataset),
        note: results.length === 0
          ? "No matching datasets found. Try broader search terms."
          : undefined,
      },
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to query INPS: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}
