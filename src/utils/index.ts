/**
 * Utils module exports for Legal Knowledge MCP server.
 */

export {
  getCached,
  setCache,
  removeCached,
  getCacheStats,
  clearCache,
  invalidateExpired,
  generateCacheKey,
  isCacheEnabled,
} from "./cache.js";

export type { CacheStats } from "./cache.js";
