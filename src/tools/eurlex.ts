/**
 * EUR-Lex SPARQL Integration Tool
 * Queries EU law via the CELLAR SPARQL endpoint
 *
 * API Docs: https://eur-lex.europa.eu/content/help/data-reuse/webservice.html
 * SPARQL Endpoint: https://publications.europa.eu/webapi/rdf/sparql
 */

import { getSourceConfig, isSourceEnabled } from "../config/index.js";
import type { EurLexQueryArgs, ToolSuccessResponse, ToolErrorResponse } from "../types.js";

/**
 * Document type classes in the CDM ontology
 * These are rdf:type values, not resource-type authority URIs
 */
const DOCUMENT_TYPE_CLASSES: Record<string, string> = {
  directive: "cdm:directive",
  regulation: "cdm:regulation",
  decision: "cdm:decision",
  case_law: "cdm:judgement",
};

/**
 * Result structure for EUR-Lex queries
 */
interface EurLexResult {
  celex: string;
  title: string;
  date: string;
  document_type: string;
  url: string;
}

/**
 * Build SPARQL query from natural language or use provided raw SPARQL
 * Uses regex-based search for better performance on CELLAR endpoint
 */
function buildSparqlQuery(args: EurLexQueryArgs): string {
  // If raw SPARQL provided, use it directly
  if (args.sparql) {
    return args.sparql;
  }

  const limit = args.limit || 10;

  // Build document type filter using rdf:type (a)
  let typeFilter = "";
  if (args.document_type && args.document_type !== "all") {
    const typeClass = DOCUMENT_TYPE_CLASSES[args.document_type];
    if (typeClass) {
      typeFilter = `?work a ${typeClass}.`;
    }
  }

  // Extract keywords from natural language query (words > 2 chars)
  const keywords = args.query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[^a-z0-9]/g, "")) // Remove special chars
    .filter((w) => w.length > 0);

  // Build regex filter for SPARQL (more performant than CONTAINS)
  let keywordFilter = "";
  if (keywords.length > 0) {
    // Use regex with case-insensitive flag for better performance
    const regexPattern = keywords.join("|");
    keywordFilter = `FILTER(REGEX(?title, "${regexPattern}", "i"))`;
  }

  return `
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>

SELECT DISTINCT ?celex ?title ?date
WHERE {
  ?work cdm:resource_legal_id_celex ?celex.
  ${typeFilter}
  ?exp cdm:expression_belongs_to_work ?work.
  ?exp cdm:expression_title ?title.
  OPTIONAL { ?work cdm:work_date_document ?date. }
  ${keywordFilter}
}
ORDER BY DESC(?date)
LIMIT ${limit}
  `.trim();
}

/**
 * Parse SPARQL results into structured format
 */
function parseResults(data: any, documentType?: string): EurLexResult[] {
  if (!data?.results?.bindings) {
    return [];
  }

  return data.results.bindings.map((binding: any) => {
    const celex = binding.celex?.value || "";

    // Infer document type from CELEX number if not provided
    // CELEX format: sector(1) + year(4) + type(1) + number
    // Type codes: L=directive, R=regulation, D=decision, C/J=case-law
    let docType = documentType?.toUpperCase() || "UNKNOWN";
    if (docType === "UNKNOWN" && celex) {
      const typeCode = celex.charAt(5);
      if (typeCode === "L") docType = "DIRECTIVE";
      else if (typeCode === "R") docType = "REGULATION";
      else if (typeCode === "D") docType = "DECISION";
      else if (typeCode === "C" || typeCode === "J") docType = "CASE_LAW";
    }

    return {
      celex,
      title: binding.title?.value || "",
      date: binding.date?.value || "",
      document_type: docType,
      url: celex
        ? `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`
        : "",
    };
  });
}

/**
 * Handle EUR-Lex tool calls
 */
export async function handleEurLex(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_query_eurlex";

  // Check if source is enabled
  if (!isSourceEnabled("eurlex")) {
    return {
      status: "error",
      tool: toolName,
      error: "EUR-Lex source is disabled in configuration",
      code: "SOURCE_DISABLED",
    };
  }

  // Validate required arguments
  const input = args as unknown as EurLexQueryArgs;
  if (!input.query && !input.sparql) {
    return {
      status: "error",
      tool: toolName,
      error: "Either 'query' or 'sparql' parameter is required",
      code: "INVALID_ARGUMENTS",
    };
  }

  try {
    const config = getSourceConfig("eurlex");
    const sparqlQuery = buildSparqlQuery(input);

    // Make SPARQL request
    const response = await fetch(config.sparql_endpoint!, {
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
        error: `EUR-Lex API error: ${response.status} ${response.statusText}`,
        code: "API_ERROR",
        details: {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500),
        },
      };
    }

    const data = await response.json();
    const results = parseResults(data, input.document_type);

    return {
      status: "success",
      tool: toolName,
      source: "EUR-Lex CELLAR",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query || "[raw SPARQL]",
        document_type: input.document_type || "all",
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
      error: `Failed to query EUR-Lex: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}
