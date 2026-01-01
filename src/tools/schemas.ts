/**
 * JSON Schema definitions for Legal Knowledge MCP server tools.
 * These schemas are used by the MCP SDK for tool registration and validation.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * EUR-Lex SPARQL Query Tool
 * Source: https://publications.europa.eu/webapi/rdf/sparql
 */
export const EURLEX_TOOL: Tool = {
  name: "legal_query_eurlex",
  description: "Query EU law via EUR-Lex SPARQL endpoint. Returns EU directives, regulations, and case law.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Natural language query about EU law",
      },
      sparql: {
        type: "string",
        description: "Optional: raw SPARQL query for advanced users",
      },
      document_type: {
        type: "string",
        enum: ["directive", "regulation", "decision", "case_law", "all"],
        description: "Type of EU document to search",
      },
      limit: {
        type: "number",
        description: "Maximum results to return (default: 10)",
        default: 10,
      },
    },
    required: ["query"],
  },
};

/**
 * INPS OpenData Query Tool
 * Source: https://serviziweb2.inps.it/odapi/
 */
export const INPS_TOOL: Tool = {
  name: "legal_query_inps",
  description: "Query Italian INPS OpenData for social security rates, contributions, and statistics.",
  inputSchema: {
    type: "object",
    properties: {
      dataset: {
        type: "string",
        description: "Dataset ID or search term",
      },
      query: {
        type: "string",
        description: "Natural language query about Italian social security",
      },
    },
    required: ["query"],
  },
};

/**
 * Normattiva Italian Legislation Search Tool
 * Source: https://www.normattiva.it
 */
export const NORMATTIVA_TOOL: Tool = {
  name: "legal_search_normattiva",
  description: "Search Italian legislation on Normattiva. Returns laws, decrees, and regulations.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search terms for Italian legislation",
      },
      act_type: {
        type: "string",
        enum: ["legge", "decreto_legislativo", "decreto_legge", "dpr", "all"],
        description: "Type of legislative act (legge=law, decreto_legislativo=legislative decree, decreto_legge=law decree, dpr=presidential decree)",
      },
      year: {
        type: "number",
        description: "Year of the act",
      },
      number: {
        type: "number",
        description: "Act number",
      },
    },
    required: ["query"],
  },
};

/**
 * Agenzia Entrate Circolari Search Tool
 * Source: https://www.agenziaentrate.gov.it
 */
export const CIRCOLARI_TOOL: Tool = {
  name: "legal_search_circolari",
  description: "Search Agenzia Entrate circolari and risoluzioni for Italian tax guidance.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search terms for tax circolari",
      },
      year: {
        type: "number",
        description: "Year of circolare",
      },
      number: {
        type: "string",
        description: "Circolare number (e.g., '33/E')",
      },
      topic: {
        type: "string",
        enum: ["redditi", "iva", "registro", "successioni", "agevolazioni", "all"],
        description: "Tax topic area (redditi=income, iva=VAT, registro=registration, successioni=inheritance, agevolazioni=deductions)",
      },
    },
    required: ["query"],
  },
};

/**
 * AADE Greek Tax Authority Search Tool
 * Source: https://www.aade.gr
 */
export const AADE_TOOL: Tool = {
  name: "legal_search_aade",
  description: "Search Greek AADE for tax guidance, circulars, and procedures.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search terms for Greek tax guidance",
      },
      topic: {
        type: "string",
        enum: ["income_tax", "vat", "efka", "ike", "all"],
        description: "Tax topic area (efka=social security, ike=private company)",
      },
    },
    required: ["query"],
  },
};

/**
 * dati.gov.it Open Data Query Tool
 * Source: https://www.dati.gov.it/api/3/action/
 */
export const DATIGOV_TOOL: Tool = {
  name: "legal_query_datigov",
  description: "Query Italian open data catalog (dati.gov.it) for public administration datasets.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search terms for Italian open data",
      },
      organization: {
        type: "string",
        description: "Publishing organization filter",
      },
    },
    required: ["query"],
  },
};

/**
 * All tool schemas for registration
 */
export const ALL_TOOL_SCHEMAS: Tool[] = [
  EURLEX_TOOL,
  INPS_TOOL,
  NORMATTIVA_TOOL,
  CIRCOLARI_TOOL,
  AADE_TOOL,
  DATIGOV_TOOL,
];
