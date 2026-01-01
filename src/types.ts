/**
 * TypeScript types for Legal Knowledge MCP server tools.
 * These types match the JSON schemas defined in tools/schemas.ts
 */

// EUR-Lex Tool Types
export type EurLexDocumentType = "directive" | "regulation" | "decision" | "case_law" | "all";

export interface EurLexQueryArgs {
  query: string;
  sparql?: string;
  document_type?: EurLexDocumentType;
  limit?: number;
}

// INPS Tool Types
export interface InpsQueryArgs {
  query: string;
  dataset?: string;
}

// Normattiva Tool Types
export type NormattivaActType = "legge" | "decreto_legislativo" | "decreto_legge" | "dpr" | "all";

export interface NormattivaSearchArgs {
  query: string;
  act_type?: NormattivaActType;
  year?: number;
  number?: number;
}

// Agenzia Entrate (Circolari) Tool Types
export type CircolariTopic = "redditi" | "iva" | "registro" | "successioni" | "agevolazioni" | "all";

export interface CircolariSearchArgs {
  query: string;
  year?: number;
  number?: string;
  topic?: CircolariTopic;
}

// AADE (Greek Tax) Tool Types
export type AadeTopic = "income_tax" | "vat" | "efka" | "ike" | "all";

export interface AadeSearchArgs {
  query: string;
  topic?: AadeTopic;
}

// dati.gov.it Tool Types
export interface DatiGovQueryArgs {
  query: string;
  organization?: string;
}

// Union type for all tool arguments
export type ToolArgs =
  | EurLexQueryArgs
  | InpsQueryArgs
  | NormattivaSearchArgs
  | CircolariSearchArgs
  | AadeSearchArgs
  | DatiGovQueryArgs;

// Tool response types
export interface ToolSuccessResponse {
  status: "success";
  tool: string;
  data: unknown;
  source: string;
  cached?: boolean;
  timestamp: string;
}

export interface ToolStubResponse {
  status: "stub";
  tool: string;
  message: string;
  received_args: Record<string, unknown>;
  source: string;
}

export interface ToolErrorResponse {
  status: "error";
  tool: string;
  error: string;
  code: string;
  details?: unknown;
}

export type ToolResponse = ToolSuccessResponse | ToolStubResponse | ToolErrorResponse;
