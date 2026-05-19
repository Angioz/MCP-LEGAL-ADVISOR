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

// Camera dei Deputati Tool Types
export interface CameraQueryArgs {
  query: string;
  legislature?: number;
  document_type?: "atto" | "interrogazione" | "mozione" | "all";
  limit?: number;
}

// Senato Tool Types
export interface SenatoQueryArgs {
  query: string;
  legislature?: number;
  document_type?: "ddl" | "atto" | "interrogazione" | "all";
  limit?: number;
}

// EU Open Data Tool Types
export interface EuDataQueryArgs {
  query: string;
  category?: string;
  publisher?: string;
  limit?: number;
}

// UK Legislation Tool Types
export interface UkLegislationArgs {
  query: string;
  type?: "ukpga" | "uksi" | "asp" | "all";
  year?: number;
  limit?: number;
}

// Légifrance (France) Tool Types
export interface LegifranceArgs {
  query: string;
  type?: "loi" | "ordonnance" | "decret" | "arrete" | "code" | "all";
  date_from?: string;
  date_to?: string;
  limit?: number;
}

// German Laws Tool Types
export interface GermanyLawArgs {
  query: string;
  law_code?: string;
  limit?: number;
}

// Spanish BOE Tool Types
export interface SpainBoeArgs {
  query: string;
  department?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

// Paraguay Congress Tool Types
export interface ParaguayCongressArgs {
  query: string;
  type?: "ley" | "proyecto" | "all";
  year?: number;
  chamber?: "S" | "D";
  limit?: number;
}

// Paraguay DNIT Tool Types
export type ParaguayDnitTopic = "renta" | "iva" | "residencia_fiscal" | "ruc" | "all";

export interface ParaguayDnitArgs {
  query: string;
  ruc?: string;
  topic?: ParaguayDnitTopic;
}

// Paraguay Open Data Tool Types
export interface ParaguayOpenDataArgs {
  query: string;
  organization?: string;
  limit?: number;
}

// Union type for all tool arguments
export type ToolArgs =
  | EurLexQueryArgs
  | InpsQueryArgs
  | NormattivaSearchArgs
  | CircolariSearchArgs
  | AadeSearchArgs
  | DatiGovQueryArgs
  | CameraQueryArgs
  | SenatoQueryArgs
  | EuDataQueryArgs
  | UkLegislationArgs
  | LegifranceArgs
  | GermanyLawArgs
  | SpainBoeArgs
  | ParaguayCongressArgs
  | ParaguayDnitArgs
  | ParaguayOpenDataArgs;

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
