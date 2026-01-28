/**
 * Senato della Repubblica SPARQL Integration Tool
 * Queries Italian Parliament (Senate) via SPARQL endpoint
 *
 * API Docs: https://dati.senato.it/
 * SPARQL Endpoint: https://dati.senato.it/sparql
 * Ontology: http://dati.senato.it/ocd/
 */

import type { ToolSuccessResponse, ToolErrorResponse } from "../types.js";

const SPARQL_ENDPOINT = "https://dati.senato.it/sparql";

/**
 * Arguments for Senato queries
 */
export interface SenatoQueryArgs {
  query: string;
  legislature?: number;
  document_type?: "ddl" | "atto" | "interrogazione" | "all";
  limit?: number;
}

/**
 * Result structure for Senato queries
 */
interface SenatoResult {
  title: string;
  date: string;
  type: string;
  legislature: string;
  url: string;
}

/**
 * Build SPARQL query for Senato della Repubblica
 */
function buildSparqlQuery(args: SenatoQueryArgs): string {
  const limit = args.limit || 10;

  // Extract keywords from natural language query
  const keywords = args.query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[^a-zA-Zàèéìòù0-9]/g, ""))
    .filter((w) => w.length > 0);

  // Build regex filter for SPARQL
  let keywordFilter = "";
  if (keywords.length > 0) {
    const regexPattern = keywords.join("|");
    keywordFilter = `FILTER(REGEX(?title, "${regexPattern}", "i"))`;
  }

  // Legislature filter
  let legislatureFilter = "";
  if (args.legislature) {
    legislatureFilter = `FILTER(?leg = ${args.legislature})`;
  }

  return `
PREFIX ocd: <http://dati.senato.it/ocd/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?atto ?title ?date ?type ?leg
WHERE {
  ?atto a ocd:atto.
  ?atto dc:title ?title.
  OPTIONAL { ?atto dc:date ?date. }
  OPTIONAL { ?atto a ?type. FILTER(?type != ocd:atto) }
  OPTIONAL { ?atto ocd:legislatura ?leg. }
  ${keywordFilter}
  ${legislatureFilter}
}
ORDER BY DESC(?date)
LIMIT ${limit}
  `.trim();
}

/**
 * Parse SPARQL results into structured format
 */
function parseResults(data: any): SenatoResult[] {
  if (!data?.results?.bindings) {
    return [];
  }

  return data.results.bindings.map((binding: any) => {
    const attoUri = binding.atto?.value || "";
    const attoId = attoUri.split("/").pop() || "";

    return {
      title: binding.title?.value || "",
      date: binding.date?.value || "",
      type: binding.type?.value?.split("/").pop() || "atto",
      legislature: binding.leg?.value || "",
      url: attoUri || `https://dati.senato.it/atto/${attoId}`,
    };
  });
}

/**
 * Handle Senato della Repubblica tool calls
 */
export async function handleSenato(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_query_senato";

  // Validate required arguments
  const input = args as unknown as SenatoQueryArgs;
  if (!input.query) {
    return {
      status: "error",
      tool: toolName,
      error: "The 'query' parameter is required",
      code: "INVALID_ARGUMENTS",
    };
  }

  try {
    const sparqlQuery = buildSparqlQuery(input);

    // Make SPARQL request using GET (Senato endpoint blocks POST requests)
    const queryUrl = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(sparqlQuery)}`;
    const response = await fetch(queryUrl, {
      method: "GET",
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "LegalKnowledgeMCP/1.0 (Open Source Legal Research Tool)",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        status: "error",
        tool: toolName,
        error: `Senato API error: ${response.status} ${response.statusText}`,
        code: "API_ERROR",
        details: {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500),
        },
      };
    }

    const data = await response.json();
    const results = parseResults(data);

    return {
      status: "success",
      tool: toolName,
      source: "Senato della Repubblica - Open Data",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query,
        legislature: input.legislature || "all",
        result_count: results.length,
        results,
        sparql_used: sparqlQuery,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to query Senato: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}
