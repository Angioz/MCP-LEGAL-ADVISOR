/**
 * Tool registry and dispatcher for Legal Knowledge MCP server.
 * Phase 1: EUR-Lex, INPS, dati.gov.it implementations
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ALL_TOOL_SCHEMAS } from "./schemas.js";
import { handleEurLex } from "./eurlex.js";
import { handleInps } from "./inps.js";
import { handleDatigov } from "./datigov.js";
import { handleNormattiva } from "./normattiva.js";
import { handleCircolari } from "./agenzia-entrate.js";
import { handleAade } from "./aade.js";
import type { ToolStubResponse, ToolErrorResponse, ToolResponse } from "../types.js";

// Export all tools for registration
export const TOOLS: Tool[] = ALL_TOOL_SCHEMAS;

/**
 * Map of tool names to their handlers
 * Phase 1 tools are implemented, others return stubs
 */
const TOOL_HANDLERS: Record<
  string,
  (args: Record<string, unknown>) => Promise<ToolResponse>
> = {
  // Phase 1 - Direct API Sources (ALL IMPLEMENTED)
  legal_query_eurlex: handleEurLex,
  legal_query_inps: handleInps,
  legal_query_datigov: handleDatigov,

  // Phase 2 - Portal Access
  legal_search_normattiva: handleNormattiva,
  legal_search_circolari: handleCircolari,
  legal_search_aade: handleAade,
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
