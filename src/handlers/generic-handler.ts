/**
 * Generic jurisdiction handler factory.
 * Creates MCP tool handlers from configuration objects.
 * Supports: pre-indexed laws (Layer 1) + any number of live API searches (Layer 2).
 */

import type { ToolSuccessResponse, ToolErrorResponse } from "../types.js";
import { searchIndexedLaws, type LawEntry } from "../utils/keyword-search.js";

export interface SearchResult {
  title: string;
  url: string;
  type?: string;
  year?: string;
  reference?: string;
  description?: string;
  source?: string;
}

export interface LiveSearch {
  name: string;
  request: (
    query: string,
    limit: number,
    args: Record<string, unknown>
  ) => { url: string; init?: RequestInit };
  parse: (body: string, limit: number) => SearchResult[];
}

export interface JurisdictionConfig {
  toolName: string;
  displayName: string;
  source: string;
  indexedLaws: LawEntry[];
  searchUrl: (query: string) => string;
  liveSearches?: LiveSearch[];
  /** Env var the tool cannot work without; checked before any request. */
  requiredEnv?: { name: string; signupUrl: string };
}

const TIMEOUT_MS = 15000;

export function createJurisdictionHandler(config: JurisdictionConfig) {
  return async function handler(
    args: Record<string, unknown>
  ): Promise<ToolSuccessResponse | ToolErrorResponse> {
    const query = typeof args.query === "string" ? args.query.trim() : "";
    if (!query) {
      return {
        status: "error",
        tool: config.toolName,
        error: "The 'query' parameter is required",
        code: "INVALID_ARGUMENTS",
      };
    }

    if (config.requiredEnv && !process.env[config.requiredEnv.name]) {
      return {
        status: "error",
        tool: config.toolName,
        error: `${config.displayName} needs the ${config.requiredEnv.name} environment variable. Get a free key at ${config.requiredEnv.signupUrl} and add it to the "env" block of this MCP server's config.`,
        code: "CONFIGURATION_ERROR",
      };
    }

    const rawLimit = Number(args.limit);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 50) : 10;
    const topic = typeof args.topic === "string" ? args.topic : undefined;

    // Layer 1: pre-indexed laws (always available, instant)
    const results: SearchResult[] = searchIndexedLaws(config.indexedLaws, query, topic, limit).map((l) => ({
      title: l.title,
      description: l.description,
      reference: l.law_ref,
      url: l.url,
      type: l.topic,
      source: "pre-indexed",
    }));

    // Layer 2: live API searches, run in parallel; a failing source becomes a warning
    const warnings: string[] = [];
    const live = await Promise.all(
      (config.liveSearches ?? []).map(async (ls) => {
        try {
          const { url, init } = ls.request(query, limit, args);
          const response = await fetch(url, {
            ...init,
            headers: { "User-Agent": "LegalKnowledgeMCP/1.3", Accept: "application/json", ...(init?.headers ?? {}) },
            signal: AbortSignal.timeout(TIMEOUT_MS),
          });
          if (!response.ok) {
            warnings.push(`${ls.name}: HTTP ${response.status}`);
            return [];
          }
          return ls.parse(await response.text(), limit).map((r) => ({ ...r, source: r.source ?? ls.name }));
        } catch (error) {
          warnings.push(`${ls.name}: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        }
      })
    );

    for (const lr of live.flat()) {
      if (!results.some((r) => r.url === lr.url)) results.push(lr);
    }

    const liveCount = config.liveSearches?.length ?? 0;
    if (results.length === 0 && liveCount > 0 && warnings.length === liveCount) {
      return {
        status: "error",
        tool: config.toolName,
        error: `All ${config.displayName} sources failed`,
        code: "SOURCE_UNAVAILABLE",
        details: warnings,
      };
    }

    // Each source keeps its own top results; cap the total so one source cannot crowd out the rest
    const capped = results.slice(0, limit * Math.max(1, liveCount));

    return {
      status: "success",
      tool: config.toolName,
      source: config.source,
      timestamp: new Date().toISOString(),
      data: {
        query,
        result_count: capped.length,
        results: capped,
        search_url: config.searchUrl(query),
        ...(warnings.length > 0 ? { warnings } : {}),
        note:
          capped.length === 0
            ? `No results for "${query}". Browse: ${config.searchUrl(query)}`
            : `${config.displayName} search. Not legal advice; verify the official text before relying on it.`,
      },
    };
  };
}
