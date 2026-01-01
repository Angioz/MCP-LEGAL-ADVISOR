/**
 * Server configuration and utilities for the Legal Knowledge MCP server.
 * This module provides shared server functionality.
 */

export interface ServerInfo {
  name: string;
  version: string;
  description: string;
}

export const SERVER_INFO: ServerInfo = {
  name: "legal-knowledge",
  version: "0.1.0",
  description: "MCP server providing access to authoritative legal and regulatory sources across EU and Mediterranean jurisdictions",
};

/**
 * Error codes for the MCP server
 */
export enum ErrorCode {
  TOOL_NOT_FOUND = "TOOL_NOT_FOUND",
  INVALID_ARGUMENTS = "INVALID_ARGUMENTS",
  SOURCE_UNAVAILABLE = "SOURCE_UNAVAILABLE",
  RATE_LIMITED = "RATE_LIMITED",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
}

/**
 * Standard error response format
 */
export interface ToolError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

/**
 * Create a standardized error response
 */
export function createError(code: ErrorCode, message: string, details?: unknown): ToolError {
  return { code, message, details };
}
