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
 * Camera dei Deputati SPARQL Query Tool
 * Source: https://dati.camera.it/sparql
 */
export const CAMERA_TOOL: Tool = {
  name: "legal_query_camera",
  description: "Query Italian Chamber of Deputies (Camera dei Deputati) for parliamentary bills, debates, and votes via SPARQL.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Natural language query about Italian parliamentary activity",
      },
      legislature: {
        type: "number",
        description: "Legislature number to filter (e.g., 19 for current)",
      },
      document_type: {
        type: "string",
        enum: ["atto", "interrogazione", "mozione", "all"],
        description: "Type of parliamentary document",
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
 * Senato della Repubblica SPARQL Query Tool
 * Source: https://dati.senato.it/sparql
 */
export const SENATO_TOOL: Tool = {
  name: "legal_query_senato",
  description: "Query Italian Senate (Senato della Repubblica) for legislation, debates, and votes via SPARQL.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Natural language query about Italian Senate activity",
      },
      legislature: {
        type: "number",
        description: "Legislature number to filter",
      },
      document_type: {
        type: "string",
        enum: ["ddl", "atto", "interrogazione", "all"],
        description: "Type of Senate document (ddl = disegno di legge)",
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
 * EU Open Data Portal SPARQL Query Tool
 * Source: https://data.europa.eu/sparql
 */
export const EUDATA_TOOL: Tool = {
  name: "legal_query_eudata",
  description: "Query EU Open Data Portal for European datasets via SPARQL endpoint.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Natural language query for EU datasets",
      },
      category: {
        type: "string",
        description: "Dataset category filter",
      },
      publisher: {
        type: "string",
        description: "Publishing organization filter",
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
 * UK Legislation.gov.uk REST API Tool
 * Source: https://www.legislation.gov.uk/developer
 */
export const UK_LEGISLATION_TOOL: Tool = {
  name: "legal_search_uk",
  description: "Search UK legislation including Acts, Statutory Instruments, and regulations via legislation.gov.uk.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search terms for UK legislation",
      },
      type: {
        type: "string",
        enum: ["ukpga", "uksi", "asp", "all"],
        description: "Type of legislation (ukpga=UK Public General Act, uksi=Statutory Instrument, asp=Act of Scottish Parliament)",
      },
      year: {
        type: "number",
        description: "Year of legislation",
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
 * Légifrance French Law Tool
 * Source: https://www.legifrance.gouv.fr
 */
export const LEGIFRANCE_TOOL: Tool = {
  name: "legal_search_france",
  description: "Search French legislation and codes via Légifrance.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search terms for French legislation",
      },
      type: {
        type: "string",
        enum: ["loi", "ordonnance", "decret", "arrete", "code", "all"],
        description: "Type of legal text",
      },
      date_from: {
        type: "string",
        description: "Start date filter (YYYY-MM-DD format)",
      },
      date_to: {
        type: "string",
        description: "End date filter (YYYY-MM-DD format)",
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
 * German Laws (Gesetze im Internet) Tool
 * Source: https://www.gesetze-im-internet.de
 */
export const GERMANY_TOOL: Tool = {
  name: "legal_search_germany",
  description: "Search German federal laws via Gesetze im Internet. Many laws have English translations available.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search terms for German legislation",
      },
      law_code: {
        type: "string",
        description: "Specific law abbreviation (e.g., GmbHG, HGB, BGB, AktG)",
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
 * Spanish BOE (Boletín Oficial del Estado) Tool
 * Source: https://www.boe.es
 */
export const SPAIN_BOE_TOOL: Tool = {
  name: "legal_search_spain",
  description: "Search Spanish legislation via BOE (Boletín Oficial del Estado).",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search terms for Spanish legislation",
      },
      department: {
        type: "string",
        description: "Government department filter",
      },
      date_from: {
        type: "string",
        description: "Start date filter (YYYY-MM-DD format)",
      },
      date_to: {
        type: "string",
        description: "End date filter (YYYY-MM-DD format)",
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
 * All tool schemas for registration
 */
export const ALL_TOOL_SCHEMAS: Tool[] = [
  // Existing tools
  EURLEX_TOOL,
  INPS_TOOL,
  NORMATTIVA_TOOL,
  CIRCOLARI_TOOL,
  AADE_TOOL,
  DATIGOV_TOOL,
  // New tools - Italian Parliament
  CAMERA_TOOL,
  SENATO_TOOL,
  // New tools - EU
  EUDATA_TOOL,
  // New tools - European countries
  UK_LEGISLATION_TOOL,
  LEGIFRANCE_TOOL,
  GERMANY_TOOL,
  SPAIN_BOE_TOOL,
];
