/**
 * Tool registry and dispatcher for Legal Knowledge MCP server.
 * 16 tools covering EU, Italy, Greece, UK, France, Germany, Spain, Paraguay
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ALL_TOOL_SCHEMAS } from "./schemas.js";
import { handleEurLex } from "./eurlex.js";
import { handleInps } from "./inps.js";
import { handleDatigov } from "./datigov.js";
import { handleNormattiva } from "./normattiva.js";
import { handleCircolari } from "./agenzia-entrate.js";
import { handleAade } from "./aade.js";
// New tools - Italian Parliament
import { handleCamera } from "./camera.js";
import { handleSenato } from "./senato.js";
// New tools - EU
import { handleEuData } from "./eudata.js";
// New tools - European countries
import { handleUkLegislation } from "./uk-legislation.js";
import { handleLegifrance } from "./legifrance.js";
import { handleGermany } from "./germany.js";
import { handleSpainBoe } from "./spain-boe.js";
// New tools - Paraguay
import { handleParaguayCongress } from "./paraguay-congress.js";
import { handleParaguayDnit } from "./paraguay-dnit.js";
import { handleParaguayOpenData } from "./paraguay-opendata.js";
import type { ToolStubResponse, ToolErrorResponse, ToolResponse } from "../types.js";

// Export all tools for registration
export const TOOLS: Tool[] = ALL_TOOL_SCHEMAS;

/**
 * Map of tool names to their handlers
 * All 16 tools are implemented
 */
const TOOL_HANDLERS: Record<
  string,
  (args: Record<string, unknown>) => Promise<ToolResponse>
> = {
  // Original tools - EU & Italy & Greece
  legal_query_eurlex: handleEurLex,
  legal_query_inps: handleInps,
  legal_query_datigov: handleDatigov,
  legal_search_normattiva: handleNormattiva,
  legal_search_circolari: handleCircolari,
  legal_search_aade: handleAade,

  // New tools - Italian Parliament
  legal_query_camera: handleCamera,
  legal_query_senato: handleSenato,

  // New tools - EU Open Data
  legal_query_eudata: handleEuData,

  // New tools - European countries
  legal_search_uk: handleUkLegislation,
  legal_search_france: handleLegifrance,
  legal_search_germany: handleGermany,
  legal_search_spain: handleSpainBoe,

  // New tools - Paraguay
  legal_search_paraguay: handleParaguayCongress,
  legal_query_paraguay_dnit: handleParaguayDnit,
  legal_query_paraguay_opendata: handleParaguayOpenData,
};

/**
 * Handle tool calls - routes to specific handlers or returns stub
 */
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const tool = TOOLS.find((t) => t.name === name);

  if (!tool) {
    const errorResponse: ToolErrorResponse = {
      status: "error",
      tool: name,
      error: `Unknown tool: ${name}`,
      code: "TOOL_NOT_FOUND",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(errorResponse, null, 2) }],
    };
  }

  // Check if we have a handler for this tool
  const handler = TOOL_HANDLERS[name];
  if (handler) {
    const response = await handler(args);
    return {
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
    };
  }

  // Return stub response for unimplemented tools
  const stubResponse: ToolStubResponse = {
    status: "stub",
    tool: name,
    message: `Tool '${name}' is registered but implementation is pending`,
    received_args: args,
    source: tool.description ?? "Unknown source",
  };

  return {
    content: [{ type: "text", text: JSON.stringify(stubResponse, null, 2) }],
  };
}
