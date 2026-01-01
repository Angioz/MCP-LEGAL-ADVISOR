/**
 * Configuration loader for Legal Knowledge MCP server.
 * Loads source endpoints, rate limits, and cache settings from YAML.
 */

import { readFileSync, existsSync } from "fs";
import { parse } from "yaml";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Configuration for individual data sources
 */
export interface SourceConfig {
  name: string;
  base_url?: string;
  sparql_endpoint?: string;
  rest_endpoint?: string;
  search_url?: string;
  circolari_path?: string;
  rate_limit: number;
  enabled: boolean;
  endpoints?: Record<string, string>;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  directory: string;
  ttl_hours: number;
  max_size_mb: number;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: "debug" | "info" | "warn" | "error";
  file: string;
}

/**
 * Complete configuration structure
 */
export interface Config {
  sources: {
    eurlex: SourceConfig;
    inps: SourceConfig;
    normattiva: SourceConfig;
    agenzia_entrate: SourceConfig;
    aade: SourceConfig;
    datigov: SourceConfig;
  };
  cache: CacheConfig;
  logging: LoggingConfig;
}

// Cached configuration instance
let cachedConfig: Config | null = null;

/**
 * Load configuration from YAML file.
 * Configuration is cached after first load.
 */
export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Try multiple paths to find config
  const possiblePaths = [
    join(__dirname, "../../config/sources.yaml"),
    join(__dirname, "../../../config/sources.yaml"),
    join(process.cwd(), "config/sources.yaml"),
  ];

  let configPath: string | null = null;
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      configPath = path;
      break;
    }
  }

  if (!configPath) {
    throw new Error(
      `Configuration file not found. Searched paths:\n${possiblePaths.join("\n")}`
    );
  }

  const content = readFileSync(configPath, "utf-8");
  cachedConfig = parse(content) as Config;

  return cachedConfig;
}

/**
 * Get configuration for a specific source
 */
export function getSourceConfig(sourceName: keyof Config["sources"]): SourceConfig {
  const config = loadConfig();
  const source = config.sources[sourceName];

  if (!source) {
    throw new Error(`Unknown source: ${sourceName}`);
  }

  return source;
}

/**
 * Check if a source is enabled
 */
export function isSourceEnabled(sourceName: keyof Config["sources"]): boolean {
  try {
    const source = getSourceConfig(sourceName);
    return source.enabled;
  } catch {
    return false;
  }
}

/**
 * Get cache configuration
 */
export function getCacheConfig(): CacheConfig {
  const config = loadConfig();
  return config.cache;
}

/**
 * Get logging configuration
 */
export function getLoggingConfig(): LoggingConfig {
  const config = loadConfig();
  return config.logging;
}

/**
 * Clear cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
