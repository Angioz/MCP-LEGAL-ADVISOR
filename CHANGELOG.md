# Changelog

All notable changes to the Legal Knowledge MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Additional jurisdictions (US, Canada, Australia)
- Smart legal advisor features
- Citation cross-referencing
- Multi-language query support

## [1.0.0] - 2026-01-28

### Added

#### Core MCP Server
- Model Context Protocol server implementation for Claude integration
- TypeScript codebase with full type safety
- Configuration-driven architecture via `sources.yaml`

#### Legal Tools (13 total across 7 jurisdictions)

**European Union (2 tools)**
- `legal_query_eurlex` - EUR-Lex SPARQL endpoint for EU directives, regulations, decisions, and case law
- `legal_query_eudata` - EU Open Data Portal SPARQL endpoint for European datasets

**Italy (6 tools)**
- `legal_search_normattiva` - Italian legislation search (laws, decrees, regulations)
- `legal_query_inps` - INPS OpenData for social security rates and contributions
- `legal_search_circolari` - Agenzia Entrate tax guidance and circolari
- `legal_query_datigov` - Italian open data catalog (dati.gov.it)
- `legal_query_camera` - Chamber of Deputies parliamentary data via SPARQL
- `legal_query_senato` - Senate parliamentary data via SPARQL

**Greece (1 tool)**
- `legal_search_aade` - AADE tax authority guidance and procedures

**United Kingdom (1 tool)**
- `legal_search_uk` - legislation.gov.uk REST API for UK Acts and Statutory Instruments

**France (1 tool)**
- `legal_search_france` - Legifrance pre-indexed French codes and laws

**Germany (1 tool)**
- `legal_search_germany` - Gesetze im Internet for federal German laws

**Spain (1 tool)**
- `legal_search_spain` - BOE (Boletin Oficial del Estado) for Spanish legislation

#### Documentation
- Comprehensive README with installation guides
- Tool parameter documentation
- Usage examples for each jurisdiction

#### Infrastructure
- npm package configuration
- TypeScript build system
- Claude Desktop and project-level MCP configuration support

### Technical Notes
- All data sources are public and require no authentication
- SPARQL endpoints for structured queries (EUR-Lex, Camera, Senato, EU Data)
- REST APIs for full-text search (UK, INPS, dati.gov.it)
- Pre-indexed content for sources without APIs (France, Germany, Spain)
- Graceful error handling for all tools

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | 2026-01-28 | Initial release with 13 tools across 7 jurisdictions |

---

[Unreleased]: https://github.com/Angioz/MCP-LEGAL-ADVISOR/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Angioz/MCP-LEGAL-ADVISOR/releases/tag/v1.0.0
