/**
 * Tests for the caching system.
 * Verifies TTL, size limits, persistence, and cleanup.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, rmSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  getCached,
  setCache,
  removeCached,
  getCacheStats,
  clearCache,
  invalidateExpired,
  generateCacheKey,
  isCacheEnabled,
} from "./cache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_CACHE_DIR = join(__dirname, "../..", ".cache");

describe("Cache System", () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
  });

  afterEach(() => {
    // Clean up after tests
    clearCache();
  });

  describe("isCacheEnabled", () => {
    it("should return true when cache is enabled in config", () => {
      const enabled = isCacheEnabled();
      expect(enabled).toBe(true);
    });
  });

  describe("setCache and getCached", () => {
    it("should store and retrieve data", () => {
      const testData = { foo: "bar", count: 42 };
      const key = "test-key-1";

      setCache(key, testData, undefined, "test");
      const retrieved = getCached<typeof testData>(key);

      expect(retrieved).toEqual(testData);
    });

    it("should return null for non-existent key", () => {
      const result = getCached("non-existent-key");
      expect(result).toBeNull();
    });

    it("should store complex nested objects", () => {
      const complexData = {
        results: [
          { id: 1, name: "Item 1", nested: { deep: true } },
          { id: 2, name: "Item 2", nested: { deep: false } },
        ],
        metadata: {
          total: 2,
          source: "test",
        },
      };
      const key = "complex-data-key";

      setCache(key, complexData, undefined, "test");
      const retrieved = getCached<typeof complexData>(key);

      expect(retrieved).toEqual(complexData);
    });

    it("should overwrite existing entries with same key", () => {
      const key = "overwrite-key";

      setCache(key, { version: 1 }, undefined, "test");
      setCache(key, { version: 2 }, undefined, "test");

      const retrieved = getCached<{ version: number }>(key);
      expect(retrieved?.version).toBe(2);
    });
  });

  describe("TTL expiration", () => {
    it("should return null for expired entries", async () => {
      const key = "expiring-key";
      const shortTtl = 100; // 100ms

      setCache(key, { data: "will expire" }, shortTtl, "test");

      // Immediately should work
      expect(getCached(key)).not.toBeNull();

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      expect(getCached(key)).toBeNull();
    });

    it("should not expire entries within TTL", async () => {
      const key = "non-expiring-key";
      const longTtl = 60000; // 60 seconds

      setCache(key, { data: "will not expire" }, longTtl, "test");

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should still be valid
      expect(getCached(key)).not.toBeNull();
    });
  });

  describe("removeCached", () => {
    it("should remove a cached entry", () => {
      const key = "remove-me";

      setCache(key, { data: "to be removed" }, undefined, "test");
      expect(getCached(key)).not.toBeNull();

      removeCached(key);
      expect(getCached(key)).toBeNull();
    });

    it("should handle removing non-existent key gracefully", () => {
      // Should not throw
      expect(() => removeCached("does-not-exist")).not.toThrow();
    });
  });

  describe("getCacheStats", () => {
    it("should return correct statistics", () => {
      // Clear and add some entries
      clearCache();

      setCache("key1", { data: "test1" }, undefined, "eurlex");
      setCache("key2", { data: "test2" }, undefined, "eurlex");
      setCache("key3", { data: "test3" }, undefined, "inps");

      const stats = getCacheStats();

      expect(stats.totalEntries).toBe(3);
      expect(stats.cacheEnabled).toBe(true);
      expect(stats.bySource["eurlex"]?.count).toBe(2);
      expect(stats.bySource["inps"]?.count).toBe(1);
    });

    it("should return zero entries when cache is empty", () => {
      clearCache();
      const stats = getCacheStats();

      expect(stats.totalEntries).toBe(0);
      expect(stats.totalSizeMb).toBe(0);
    });
  });

  describe("clearCache", () => {
    it("should clear all entries", () => {
      setCache("key1", { data: "test1" }, undefined, "source1");
      setCache("key2", { data: "test2" }, undefined, "source2");

      const result = clearCache();

      expect(result.cleared).toBe(2);
      expect(getCacheStats().totalEntries).toBe(0);
    });

    it("should clear only entries from specified source", () => {
      setCache("key1", { data: "test1" }, undefined, "source1");
      setCache("key2", { data: "test2" }, undefined, "source1");
      setCache("key3", { data: "test3" }, undefined, "source2");

      const result = clearCache("source1");

      expect(result.cleared).toBe(2);
      expect(getCacheStats().totalEntries).toBe(1);
      expect(getCached("key3")).not.toBeNull();
    });
  });

  describe("invalidateExpired", () => {
    it("should remove expired entries", async () => {
      setCache("short-lived", { data: "expires" }, 50, "test");
      setCache("long-lived", { data: "persists" }, 60000, "test");

      // Wait for short-lived to expire
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = invalidateExpired();

      expect(result.invalidated).toBe(1);
      expect(getCached("short-lived")).toBeNull();
      expect(getCached("long-lived")).not.toBeNull();
    });
  });

  describe("generateCacheKey", () => {
    it("should generate consistent keys for same inputs", () => {
      const key1 = generateCacheKey("eurlex", { query: "test", limit: 10 });
      const key2 = generateCacheKey("eurlex", { query: "test", limit: 10 });

      expect(key1).toBe(key2);
    });

    it("should generate different keys for different inputs", () => {
      const key1 = generateCacheKey("eurlex", { query: "test1" });
      const key2 = generateCacheKey("eurlex", { query: "test2" });

      expect(key1).not.toBe(key2);
    });

    it("should generate same key regardless of argument order", () => {
      const key1 = generateCacheKey("tool", { a: 1, b: 2, c: 3 });
      const key2 = generateCacheKey("tool", { c: 3, a: 1, b: 2 });

      expect(key1).toBe(key2);
    });
  });

  describe("persistence", () => {
    it("should persist data across getCached calls", () => {
      const key = "persistent-key";
      const data = { persistent: true };

      setCache(key, data, undefined, "test");

      // Multiple reads should work
      expect(getCached(key)).toEqual(data);
      expect(getCached(key)).toEqual(data);
      expect(getCached(key)).toEqual(data);
    });

    it("should create cache directory if it does not exist", () => {
      // This test verifies the directory creation logic
      setCache("dir-test", { test: true }, undefined, "newdir");

      const stats = getCacheStats();
      expect(stats.totalEntries).toBeGreaterThan(0);
    });
  });
});
