/**
 * Camera dei Deputati SPARQL Integration Tool
 * Queries Italian Parliament (Chamber of Deputies) via SPARQL endpoint
 *
 * API Docs: https://dati.camera.it/en
 * SPARQL Endpoint: https://dati.camera.it/sparql
 * Ontology: http://dati.camera.it/ocd/
 */

import type { ToolSuccessResponse, ToolErrorResponse } from "../types.js";

const SPARQL_ENDPOINT = "https://dati.camera.it/sparql";

/**
 * Arguments for Camera dei Deputati queries
 */
export interface CameraQueryArgs {
  query: string;
  legislature?: number;
  document_type?: "atto" | "interrogazione" | "mozione" | "all";
  limit?: number;
}

/**
 * Result structure for Camera queries
 */
interface CameraResult {
  title: string;
  date: string;
  type: string;
  legislature: string;
  url: string;
}

/**
 * Build SPARQL query for Camera dei Deputati
 * Uses OCD (Open Camera Data) ontology
 */
function buildSparqlQuery(args: CameraQueryArgs): string {
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
PREFIX ocd: <http://dati.camera.it/ocd/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?atto ?title ?date ?type ?leg
WHERE {
  ?atto a ocd:atto.
  ?atto dc:title ?title.
  OPTIONAL { ?atto dc:date ?date. }
  OPTIONAL { ?atto a ?type. FILTER(?type != ocd:atto) }
  OPTIONAL { ?atto ocd:rpiede_legislatura ?leg. }
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
function parseResults(data: any): CameraResult[] {
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
      url: attoUri || `https://dati.camera.it/ocd/atto/${attoId}`,
    };
  });
}

/**
 * Handle Camera dei Deputati tool calls
 */
export async function handleCamera(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_query_camera";

  // Validate required arguments
  const input = args as unknown as CameraQueryArgs;
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

    // Make SPARQL request
    const response = await fetch(SPARQL_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/sparql-results+json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `query=${encodeURIComponent(sparqlQuery)}`,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        status: "error",
        tool: toolName,
        error: `Camera API error: ${response.status} ${response.statusText}`,
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
      source: "Camera dei Deputati - Open Data",
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
      error: `Failed to query Camera dei Deputati: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}
