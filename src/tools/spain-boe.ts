/**
 * Spanish BOE (Boletín Oficial del Estado) Integration Tool
 * Queries Spanish legislation via the official open data portal
 *
 * API Docs: https://www.boe.es/datosabiertos/
 * Base URL: https://www.boe.es
 */

import type { ToolSuccessResponse, ToolErrorResponse } from "../types.js";
import { searchIndexedLaws } from "../utils/keyword-search.js";
import { SPAIN_LAWS } from "../data/indexed-laws.js";

const BASE_URL = "https://www.boe.es";
const API_BASE = "https://www.boe.es/datosabiertos/api";

/**
 * Arguments for Spanish BOE queries
 */
export interface SpainBoeArgs {
  query: string;
  department?: string;
  date_from?: string; // YYYY-MM-DD format
  date_to?: string;
  limit?: number;
}

/**
 * Result structure for BOE queries
 */
interface BoeResult {
  title: string;
  department: string;
  date: string;
  reference: string;
  url: string;
  pdf_url?: string;
}

/**
 * Pre-indexed important Spanish legal texts
 */
const INDEXED_LAWS: Record<string, BoeResult[]> = {
  sociedades: [
    {
      title: "Real Decreto Legislativo 1/2010 - Ley de Sociedades de Capital",
      department: "Ministerio de Justicia",
      date: "2010-07-02",
      reference: "BOE-A-2010-10544",
      url: "https://www.boe.es/buscar/act.php?id=BOE-A-2010-10544",
      pdf_url: "https://www.boe.es/boe/dias/2010/07/03/pdfs/BOE-A-2010-10544.pdf",
    },
  ],
  startup: [
    {
      title: "Ley 28/2022 de fomento del ecosistema de las empresas emergentes (Ley de Startups)",
      department: "Jefatura del Estado",
      date: "2022-12-21",
      reference: "BOE-A-2022-21739",
      url: "https://www.boe.es/buscar/act.php?id=BOE-A-2022-21739",
      pdf_url: "https://www.boe.es/boe/dias/2022/12/22/pdfs/BOE-A-2022-21739.pdf",
    },
  ],
  autonomo: [
    {
      title: "Ley 20/2007 del Estatuto del trabajo autónomo",
      department: "Jefatura del Estado",
      date: "2007-07-11",
      reference: "BOE-A-2007-13409",
      url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-13409",
    },
  ],
  data_protection: [
    {
      title: "Ley Orgánica 3/2018 de Protección de Datos Personales (LOPDGDD)",
      department: "Jefatura del Estado",
      date: "2018-12-05",
      reference: "BOE-A-2018-16673",
      url: "https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673",
    },
  ],
  fiscal: [
    {
      title: "Ley 35/2006 del Impuesto sobre la Renta de las Personas Físicas (IRPF)",
      department: "Jefatura del Estado",
      date: "2006-11-28",
      reference: "BOE-A-2006-20764",
      url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764",
    },
    {
      title: "Ley 27/2014 del Impuesto sobre Sociedades",
      department: "Jefatura del Estado",
      date: "2014-11-27",
      reference: "BOE-A-2014-12328",
      url: "https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328",
    },
  ],
  iva: [
    {
      title: "Ley 37/1992 del Impuesto sobre el Valor Añadido (IVA)",
      department: "Jefatura del Estado",
      date: "1992-12-28",
      reference: "BOE-A-1992-28740",
      url: "https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740",
    },
  ],
  laboral: [
    {
      title: "Real Decreto Legislativo 2/2015 - Estatuto de los Trabajadores",
      department: "Ministerio de Empleo y Seguridad Social",
      date: "2015-10-23",
      reference: "BOE-A-2015-11430",
      url: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430",
    },
  ],
  comercio: [
    {
      title: "Real Decreto de 22 de agosto de 1885 - Código de Comercio",
      department: "Ministerio de Gracia y Justicia",
      date: "1885-08-22",
      reference: "BOE-A-1885-6627",
      url: "https://www.boe.es/buscar/act.php?id=BOE-A-1885-6627",
    },
  ],
  civil: [
    {
      title: "Real Decreto de 24 de julio de 1889 - Código Civil",
      department: "Ministerio de Gracia y Justicia",
      date: "1889-07-25",
      reference: "BOE-A-1889-4763",
      url: "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763",
    },
  ],
};

/**
 * Handle Spanish BOE tool calls
 */
export async function handleSpainBoe(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_search_spain";

  // Validate required arguments
  const input = args as unknown as SpainBoeArgs;
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
    const indexedMatches = searchIndexedLaws(SPAIN_LAWS, input.query, undefined, limit);
    let results: BoeResult[] = indexedMatches.map(l => ({
      title: l.title,
      department: "",
      date: "",
      reference: l.law_ref,
      url: l.url,
    }));

    // Layer 1b: Also check legacy INDEXED_LAWS
    for (const [key, laws] of Object.entries(INDEXED_LAWS)) {
      if (
        queryLower.includes(key) ||
        key.includes(queryLower) ||
        laws.some((l) => l.title.toLowerCase().includes(queryLower))
      ) {
        for (const law of laws) {
          if (!results.some((r) => r.reference === law.reference)) {
            results.push(law);
          }
        }
      }
    }

    // Layer 2: Live API search if no results yet
    if (results.length === 0) {
      results = await searchBoe(input.query, input.department, limit);
    }

    // Limit results
    results = results.slice(0, limit);

    return {
      status: "success",
      tool: toolName,
      source: "BOE - Boletín Oficial del Estado (Spain)",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query,
        department: input.department || "all",
        result_count: results.length,
        results,
        search_url: `${BASE_URL}/buscar/`,
        note:
          results.length === 0
            ? `No indexed results for "${input.query}". Search directly at ${BASE_URL}/buscar/`
            : undefined,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to query Spanish BOE: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}

/**
 * Search BOE open data API
 */
async function searchBoe(query: string, department: string | undefined, limit: number): Promise<BoeResult[]> {
  try {
    // BOE has a search interface we can query
    const searchUrl = `${BASE_URL}/buscar/act.php?campo%5B0%5D=ORI&dato%5B0%5D=&operador%5B0%5D=and&campo%5B1%5D=TIT&dato%5B1%5D=${encodeURIComponent(query)}&operador%5B1%5D=and&campo%5B2%5D=TXT&dato%5B2%5D=&acession=on&page_hits=${limit}&sort_field%5B0%5D=fpu&sort_order%5B0%5D=desc`;

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
    return parseBoeResults(html, limit);
  } catch {
    return [];
  }
}

/**
 * Parse BOE search results from HTML
 */
function parseBoeResults(html: string, limit: number): BoeResult[] {
  const results: BoeResult[] = [];

  // Match result items - BOE uses specific result format
  const resultRegex =
    /<a[^>]*href="([^"]*act\.php\?id=([^"&]+))"[^>]*>([^<]+)<\/a>[\s\S]*?<span[^>]*class="[^"]*departamento[^"]*"[^>]*>([^<]*)<\/span>/gi;

  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < limit) {
    const url = match[1];
    const reference = match[2];
    const title = match[3].trim();
    const department = match[4]?.trim() || "Unknown";

    if (title && reference) {
      results.push({
        title: decodeHtmlEntities(title),
        department: decodeHtmlEntities(department),
        date: "",
        reference,
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
    .replace(/&ntilde;/g, "ñ")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/<[^>]+>/g, "");
}
