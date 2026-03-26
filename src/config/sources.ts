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
 * Example query for a data source
 */
export interface SourceExample {
  query: string;
  description: string;
}

/**
 * Configuration for individual data sources
 */
export interface SourceConfig {
  name: string;
  description?: string;
  country?: string;
  type?: "sparql" | "rest" | "ckan";
  base_url?: string;
  sparql_endpoint?: string;
  rest_endpoint?: string;
  search_url?: string;
  circolari_path?: string;
  documentation?: string;
  rate_limit: number;
  enabled: boolean;
  endpoints?: Record<string, string>;
  examples?: SourceExample[];
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
 * Includes all 13 legal data sources across 7 jurisdictions
 */
export interface Config {
  sources: {
    // EU (2 sources)
    eurlex: SourceConfig;
    eudata: SourceConfig;
    // Italy (6 sources)
    normattiva: SourceConfig;
    inps: SourceConfig;
    agenzia_entrate: SourceConfig;
    datigov: SourceConfig;
    camera: SourceConfig;
    senato: SourceConfig;
    // Greece (1 source)
    aade: SourceConfig;
    // UK (1 source)
    uk_legislation: SourceConfig;
    // France (1 source)
    legifrance: SourceConfig;
    // Germany (1 source)
    germany: SourceConfig;
    // Spain (1 source)
    spain_boe: SourceConfig;
  };
  cache: CacheConfig;
  logging: LoggingConfig;
}

// Cached configuration instance
let cachedConfig: Config | null = null;

/**
 * Default configuration — used when no sources.yaml file is found.
 * All 13 sources are enabled by default. Users can override by placing
 * a config/sources.yaml file in the working directory.
 */
const DEFAULT_CONFIG: Config = {
  sources: {
    eurlex:          { name: "EUR-Lex", enabled: true, rate_limit: 10 },
    eudata:          { name: "EU Open Data Portal", enabled: true, rate_limit: 10 },
    normattiva:      { name: "Normattiva", enabled: true, rate_limit: 5 },
    inps:            { name: "INPS", enabled: true, rate_limit: 5 },
    agenzia_entrate: { name: "Agenzia delle Entrate", enabled: true, rate_limit: 5 },
    datigov:         { name: "Dati.gov.it", enabled: true, rate_limit: 10 },
    camera:          { name: "Camera dei Deputati", enabled: true, rate_limit: 10 },
    senato:          { name: "Senato della Repubblica", enabled: true, rate_limit: 10 },
    aade:            { name: "AADE", enabled: true, rate_limit: 5 },
    uk_legislation:  { name: "UK Legislation", enabled: true, rate_limit: 10 },
    legifrance:      { name: "Légifrance", enabled: true, rate_limit: 5 },
    germany:         { name: "Bundesrecht", enabled: true, rate_limit: 10 },
    spain_boe:       { name: "BOE España", enabled: true, rate_limit: 5 },
  },
  cache: { enabled: true, directory: ".cache", ttl_hours: 24, max_size_mb: 100 },
  logging: { level: "info", file: "legal-knowledge-mcp.log" },
};

/**
 * Load configuration from YAML file.
 * Configuration is cached after first load.
 * Falls back to DEFAULT_CONFIG if no YAML file is present.
 */
export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Try multiple paths to find an optional override file
  const possiblePaths = [
    join(__dirname, "../../config/sources.yaml"),
    join(__dirname, "../../../config/sources.yaml"),
    join(process.cwd(), "config/sources.yaml"),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      const content = readFileSync(path, "utf-8");
      cachedConfig = parse(content) as Config;
      return cachedConfig;
    }
  }

  // No override file found — use embedded defaults (all sources enabled)
  cachedConfig = DEFAULT_CONFIG;
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
  } catch (err) {
    process.stderr.write(`[legal-knowledge-mcp] Config error for source "${sourceName}": ${(err as Error).message}\n`);
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
