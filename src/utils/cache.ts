/**
 * File-based caching system for Legal Knowledge MCP server.
 * Provides TTL-based caching with size limits and persistence across restarts.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import { getCacheConfig } from "../config/index.js";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Cache entry structure stored in JSON files
 */
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  source: string;
  size: number;
}

/**
 * Cache index for tracking all entries
 */
interface CacheIndex {
  entries: Record<string, {
    file: string;
    timestamp: number;
    ttl: number;
    size: number;
    source: string;
  }>;
  totalSize: number;
  lastCleanup: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  totalSizeMb: number;
  bySource: Record<string, { count: number; sizeMb: number }>;
  cacheEnabled: boolean;
  maxSizeMb: number;
  ttlHours: number;
}

// Resolve cache directory relative to project root
function getCacheDir(): string {
  const config = getCacheConfig();
  // Go up from src/utils to project root, then to .cache
  return join(__dirname, "../..", config.directory);
}

const INDEX_FILE = "index.json";

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  const cacheDir = getCacheDir();
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
}

/**
 * Ensure source subdirectory exists
 */
function ensureSourceDir(source: string): void {
  const sourceDir = join(getCacheDir(), source);
  if (!existsSync(sourceDir)) {
    mkdirSync(sourceDir, { recursive: true });
  }
}

/**
 * Load cache index from disk
 */
function loadIndex(): CacheIndex {
  ensureCacheDir();
  const indexPath = join(getCacheDir(), INDEX_FILE);

  if (existsSync(indexPath)) {
    try {
      const content = readFileSync(indexPath, "utf-8");
      return JSON.parse(content) as CacheIndex;
    } catch (error) {
      console.error("Failed to load cache index, creating new one:", error);
    }
  }

  return { entries: {}, totalSize: 0, lastCleanup: Date.now() };
}

/**
 * Save cache index to disk
 */
function saveIndex(index: CacheIndex): void {
  ensureCacheDir();
  const indexPath = join(getCacheDir(), INDEX_FILE);
  writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

/**
 * Generate hash for cache key
 */
function hashKey(key: string): string {
  return createHash("md5").update(key).digest("hex");
}

/**
 * Check if caching is enabled
 */
export function isCacheEnabled(): boolean {
  try {
    const config = getCacheConfig();
    return config.enabled;
  } catch {
    return false;
  }
}

/**
 * Get cached data by key
 * Returns null if not found or expired
 */
export function getCached<T>(key: string): T | null {
  if (!isCacheEnabled()) {
    return null;
  }

  const index = loadIndex();
  const entry = index.entries[key];

  if (!entry) {
    return null;
  }

  // Check TTL expiration
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    // Expired - remove from cache
    removeCached(key);
    return null;
  }

  // Read data from file
  const filePath = join(getCacheDir(), entry.file);
  if (!existsSync(filePath)) {
    // File missing - clean up index
    delete index.entries[key];
    index.totalSize -= entry.size;
    saveIndex(index);
    return null;
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const cacheEntry = JSON.parse(content) as CacheEntry<T>;
    return cacheEntry.data;
  } catch (error) {
    console.error(`Failed to read cache entry ${key}:`, error);
    return null;
  }
}

/**
 * Set cache data with optional custom TTL
 * @param key - Cache key (should be unique per query)
 * @param data - Data to cache
 * @param ttlMs - Time to live in milliseconds (defaults to config ttl_hours)
 * @param source - Source identifier (eurlex, inps, etc.)
 */
export function setCache<T>(
  key: string,
  data: T,
  ttlMs?: number,
  source: string = "unknown"
): void {
  if (!isCacheEnabled()) {
    return;
  }

  const config = getCacheConfig();
  const actualTtl = ttlMs ?? config.ttl_hours * 60 * 60 * 1000;
  const maxSizeBytes = config.max_size_mb * 1024 * 1024;

  const index = loadIndex();
  const hash = hashKey(key);
  const fileName = `${source}/${hash}.json`;
  const filePath = join(getCacheDir(), fileName);

  // Ensure source directory exists
  ensureSourceDir(source);

  // Prepare cache entry
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl: actualTtl,
    source,
    size: 0,
  };

  const content = JSON.stringify(entry, null, 2);
  entry.size = Buffer.byteLength(content, "utf-8");

  // Check if we need to free up space
  const projectedSize = index.totalSize + entry.size;
  if (projectedSize > maxSizeBytes) {
    cleanupCache(index, entry.size, maxSizeBytes);
  }

  // Write cache file
  try {
    writeFileSync(filePath, content);
  } catch (error) {
    console.error(`Failed to write cache entry ${key}:`, error);
    return;
  }

  // Update index
  // If key already exists, subtract old size first
  if (index.entries[key]) {
    index.totalSize -= index.entries[key].size;
  }

  index.entries[key] = {
    file: fileName,
    timestamp: entry.timestamp,
    ttl: actualTtl,
    size: entry.size,
    source,
  };
  index.totalSize = Object.values(index.entries).reduce((sum, e) => sum + e.size, 0);

  saveIndex(index);
}

/**
 * Remove cached entry by key
 */
export function removeCached(key: string): void {
  const index = loadIndex();
  const entry = index.entries[key];

  if (!entry) {
    return;
  }

  const filePath = join(getCacheDir(), entry.file);

  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Failed to delete cache file ${entry.file}:`, error);
  }

  delete index.entries[key];
  index.totalSize = Object.values(index.entries).reduce((sum, e) => sum + e.size, 0);
  saveIndex(index);
}

/**
 * Cleanup old cache entries to free space
 * Removes oldest entries first (LRU-like behavior)
 */
function cleanupCache(index: CacheIndex, neededSpace: number, maxSize: number): void {
  // Sort entries by timestamp (oldest first)
  const entries = Object.entries(index.entries)
    .sort((a, b) => a[1].timestamp - b[1].timestamp);

  let freedSpace = 0;
  const targetFreeSpace = Math.max(neededSpace, maxSize * 0.1); // Free at least 10%

  for (const [key, entry] of entries) {
    if (freedSpace >= targetFreeSpace) {
      break;
    }

    const filePath = join(getCacheDir(), entry.file);

    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete cache file during cleanup: ${entry.file}`, error);
    }

    delete index.entries[key];
    freedSpace += entry.size;
  }

  index.totalSize = Object.values(index.entries).reduce((sum, e) => sum + e.size, 0);
  index.lastCleanup = Date.now();

  console.error(`Cache cleanup: freed ${(freedSpace / 1024 / 1024).toFixed(2)} MB`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  const config = getCacheConfig();
  const index = loadIndex();

  const bySource: Record<string, { count: number; sizeMb: number }> = {};

  for (const entry of Object.values(index.entries)) {
    if (!bySource[entry.source]) {
      bySource[entry.source] = { count: 0, sizeMb: 0 };
    }
    bySource[entry.source].count++;
    bySource[entry.source].sizeMb += entry.size / (1024 * 1024);
  }

  // Round sizeMb values
  for (const source of Object.keys(bySource)) {
    bySource[source].sizeMb = Math.round(bySource[source].sizeMb * 100) / 100;
  }

  return {
    totalEntries: Object.keys(index.entries).length,
    totalSizeMb: Math.round((index.totalSize / (1024 * 1024)) * 100) / 100,
    bySource,
    cacheEnabled: config.enabled,
    maxSizeMb: config.max_size_mb,
    ttlHours: config.ttl_hours,
  };
}

/**
 * Clear cache - optionally by source
 * @param source - If provided, only clear entries from this source
 */
export function clearCache(source?: string): { cleared: number; freedMb: number } {
  const index = loadIndex();
  let clearedCount = 0;
  let freedBytes = 0;

  const keysToRemove: string[] = [];

  for (const [key, entry] of Object.entries(index.entries)) {
    if (!source || entry.source === source) {
      const filePath = join(getCacheDir(), entry.file);

      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Failed to delete cache file: ${entry.file}`, error);
      }

      keysToRemove.push(key);
      freedBytes += entry.size;
      clearedCount++;
    }
  }

  // Remove from index
  for (const key of keysToRemove) {
    delete index.entries[key];
  }

  index.totalSize = Object.values(index.entries).reduce((sum, e) => sum + e.size, 0);
  saveIndex(index);

  return {
    cleared: clearedCount,
    freedMb: Math.round((freedBytes / (1024 / 1024)) * 100) / 100,
  };
}

/**
 * Invalidate expired entries
 * Call this periodically to clean up stale entries
 */
export function invalidateExpired(): { invalidated: number } {
  const index = loadIndex();
  const now = Date.now();
  let invalidated = 0;

  const keysToRemove: string[] = [];

  for (const [key, entry] of Object.entries(index.entries)) {
    if (now - entry.timestamp > entry.ttl) {
      const filePath = join(getCacheDir(), entry.file);

      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Failed to delete expired cache file: ${entry.file}`, error);
      }

      keysToRemove.push(key);
      invalidated++;
    }
  }

  // Remove from index
  for (const key of keysToRemove) {
    delete index.entries[key];
  }

  if (invalidated > 0) {
    index.totalSize = Object.values(index.entries).reduce((sum, e) => sum + e.size, 0);
    saveIndex(index);
  }

  return { invalidated };
}

/**
 * Generate a cache key from tool name and arguments
 * Use this to create consistent cache keys across tools
 */
export function generateCacheKey(tool: string, args: Record<string, unknown>): string {
  // Sort keys for consistent hashing
  const sortedArgs = Object.keys(args)
    .sort()
    .reduce((acc, key) => {
      acc[key] = args[key];
      return acc;
    }, {} as Record<string, unknown>);

  return `${tool}:${JSON.stringify(sortedArgs)}`;
}
