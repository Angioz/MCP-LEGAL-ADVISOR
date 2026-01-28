/**
 * Configuration module exports for Legal Knowledge MCP server.
 */

export {
  loadConfig,
  getSourceConfig,
  isSourceEnabled,
  getCacheConfig,
  getLoggingConfig,
  clearConfigCache,
} from "./sources.js";

export type {
  Config,
  SourceConfig,
  SourceExample,
  CacheConfig,
  LoggingConfig,
} from "./sources.js";
