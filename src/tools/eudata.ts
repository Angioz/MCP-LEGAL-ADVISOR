/**
 * EU Open Data Portal SPARQL Integration Tool
 * Queries European Union Open Data via SPARQL endpoint
 *
 * API Docs: https://data.europa.eu/en/about/sparql
 * SPARQL Endpoint: https://data.europa.eu/sparql
 * Ontology: DCAT-AP (Data Catalog Application Profile)
 */

import type { ToolSuccessResponse, ToolErrorResponse } from "../types.js";

const SPARQL_ENDPOINT = "https://data.europa.eu/sparql";

/**
 * Arguments for EU Open Data queries
 */
export interface EuDataQueryArgs {
  query: string;
  category?: string;
  publisher?: string;
  limit?: number;
}

/**
 * Result structure for EU Open Data queries
 */
interface EuDataResult {
  title: string;
  description: string;
  publisher: string;
  issued: string;
  url: string;
  format: string[];
}

/**
 * Build SPARQL query for EU Open Data Portal
 * Uses DCAT-AP ontology
 */
function buildSparqlQuery(args: EuDataQueryArgs): string {
  const limit = args.limit || 10;

  // Extract keywords from natural language query
  const keywords = args.query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((w) => w.length > 0);

  // Build regex filter for SPARQL
  let keywordFilter = "";
  if (keywords.length > 0) {
    const regexPattern = keywords.join("|");
    keywordFilter = `FILTER(REGEX(?title, "${regexPattern}", "i") || REGEX(?description, "${regexPattern}", "i"))`;
  }

  // Publisher filter
  let publisherFilter = "";
  if (args.publisher) {
    publisherFilter = `FILTER(REGEX(?publisherName, "${args.publisher}", "i"))`;
  }

  return `
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT DISTINCT ?dataset ?title ?description ?publisherName ?issued
WHERE {
  ?dataset a dcat:Dataset.
  ?dataset dct:title ?title.
  OPTIONAL { ?dataset dct:description ?description. }
  OPTIONAL { ?dataset dct:issued ?issued. }
  OPTIONAL {
    ?dataset dct:publisher ?publisher.
    ?publisher foaf:name ?publisherName.
  }
  FILTER(LANG(?title) = "en" || LANG(?title) = "")
  ${keywordFilter}
  ${publisherFilter}
}
ORDER BY DESC(?issued)
LIMIT ${limit}
  `.trim();
}

/**
 * Parse SPARQL results into structured format
 */
function parseResults(data: any): EuDataResult[] {
  if (!data?.results?.bindings) {
    return [];
  }

  return data.results.bindings.map((binding: any) => {
    const datasetUri = binding.dataset?.value || "";

    return {
      title: binding.title?.value || "",
      description: binding.description?.value?.substring(0, 500) || "",
      publisher: binding.publisherName?.value || "Unknown",
      issued: binding.issued?.value || "",
      url: datasetUri,
      format: [], // Would need additional query to get formats
    };
  });
}

/**
 * Handle EU Open Data Portal tool calls
 */
export async function handleEuData(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_query_eudata";

  // Validate required arguments
  const input = args as unknown as EuDataQueryArgs;
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
        "User-Agent": "LegalKnowledgeMCP/1.0 (Open Source Legal Research Tool)",
      },
      body: `query=${encodeURIComponent(sparqlQuery)}`,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        status: "error",
        tool: toolName,
        error: `EU Open Data API error: ${response.status} ${response.statusText}`,
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
      source: "EU Open Data Portal",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query,
        publisher: input.publisher || "all",
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
      error: `Failed to query EU Open Data: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}
