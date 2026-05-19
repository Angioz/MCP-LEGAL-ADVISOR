/**
 * Paraguay Congress (SILpy) Integration Tool
 * Queries Paraguayan legislation via the SILpy Open Data API
 *
 * API Docs: https://datos.congreso.gov.py/opendata/api
 * Base URL: https://datos.congreso.gov.py/opendata/api
 */

import type { ToolSuccessResponse, ToolErrorResponse } from "../types.js";

const API_BASE = "https://datos.congreso.gov.py/opendata/api";

export interface ParaguayCongressArgs {
  query: string;
  type?: "ley" | "proyecto" | "all";
  year?: number;
  chamber?: "S" | "D";
  limit?: number;
}

interface SilpyLaw {
  idLey?: number;
  descripcion?: string;
  anho?: number;
  numero?: number;
  titulo?: string;
  [key: string]: unknown;
}

interface SilpyProject {
  idProyecto?: number;
  titulo?: string;
  descripcion?: string;
  estado?: string;
  camara?: string;
  fechaIngreso?: string;
  [key: string]: unknown;
}

interface FormattedResult {
  type: string;
  id: number;
  title: string;
  description: string;
  year?: number;
  number?: number;
  status?: string;
  chamber?: string;
  date?: string;
  url: string;
}

function formatLaw(law: SilpyLaw): FormattedResult {
  return {
    type: "ley",
    id: law.idLey || 0,
    title: law.titulo || law.descripcion || "Untitled",
    description: law.descripcion || "",
    year: law.anho,
    number: law.numero,
    url: `${API_BASE}/data/ley/${law.idLey}`,
  };
}

function formatProject(proj: SilpyProject): FormattedResult {
  return {
    type: "proyecto",
    id: proj.idProyecto || 0,
    title: proj.titulo || "Untitled",
    description: proj.descripcion || "",
    status: proj.estado,
    chamber: proj.camara,
    date: proj.fechaIngreso,
    url: `${API_BASE}/data/proyecto/${proj.idProyecto}`,
  };
}

function matchesQuery(text: string, query: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = (text || "").toLowerCase();
  const words = queryLower.split(/\s+/);
  return words.some((w) => textLower.includes(w));
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "LegalKnowledgeMCP/1.0",
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function searchLaws(
  query: string,
  year?: number,
  limit: number = 10
): Promise<FormattedResult[]> {
  let laws: SilpyLaw[] = [];

  if (year) {
    const data = await fetchJson<SilpyLaw[]>(
      `${API_BASE}/data/ley/anho/${year}?limit=${limit}`
    );
    if (data) laws = data;
  } else {
    const data = await fetchJson<SilpyLaw[]>(
      `${API_BASE}/data/ley?limit=50`
    );
    if (data) laws = data;
  }

  const filtered = laws.filter(
    (l) =>
      matchesQuery(l.descripcion || "", query) ||
      matchesQuery(l.titulo || "", query)
  );

  return filtered.slice(0, limit).map(formatLaw);
}

async function searchProjects(
  query: string,
  chamber?: string,
  limit: number = 10
): Promise<FormattedResult[]> {
  let url = `${API_BASE}/data/proyecto?limit=50`;
  if (chamber) {
    url = `${API_BASE}/data/proyecto?limit=50`;
  }

  const projects = await fetchJson<SilpyProject[]>(url);
  if (!projects) return [];

  const filtered = projects.filter(
    (p) =>
      matchesQuery(p.titulo || "", query) ||
      matchesQuery(p.descripcion || "", query)
  );

  return filtered.slice(0, limit).map(formatProject);
}

export async function handleParaguayCongress(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_search_paraguay";
  const input = args as unknown as ParaguayCongressArgs;

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
    const searchType = input.type || "all";
    let results: FormattedResult[] = [];

    if (searchType === "ley" || searchType === "all") {
      const laws = await searchLaws(input.query, input.year, limit);
      results.push(...laws);
    }

    if (searchType === "proyecto" || searchType === "all") {
      const projects = await searchProjects(
        input.query,
        input.chamber,
        limit
      );
      results.push(...projects);
    }

    results = results.slice(0, limit);

    return {
      status: "success",
      tool: toolName,
      source: "SILpy - Sistema de Información Legislativa del Paraguay",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query,
        type_filter: searchType,
        year_filter: input.year || null,
        chamber_filter: input.chamber || null,
        result_count: results.length,
        results,
        api_url: API_BASE,
        note:
          results.length === 0
            ? `No results for "${input.query}". Try broader search terms or browse at ${API_BASE}`
            : undefined,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to query Paraguay Congress: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}
