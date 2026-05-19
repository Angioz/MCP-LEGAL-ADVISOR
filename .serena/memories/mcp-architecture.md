# MCP Architecture - Legal Knowledge Server

## Core Server Structure
```
legal-knowledge-mcp/
├── src/
│   ├── index.ts              # Server entry point
│   ├── server.ts             # MCP server initialization
│   ├── tools/                # 13 Legal data tools
│   │   ├── eurlex.ts         # EU regulations (SPARQL)
│   │   ├── normattiva.ts     # Italian legislation
│   │   ├── inps.ts           # Italian social security
│   │   ├── circolari.ts      # Italian tax guidance
│   │   ├── aade.ts           # Greek tax/regulatory
│   │   ├── datigov.ts        # Italian open data
│   │   ├── uk-legislation.ts # UK laws
│   │   ├── legifrance.ts     # French laws
│   │   ├── boe.ts            # Spanish legislation
│   │   ├── gesetze.ts        # German laws
│   │   ├── eurdata.ts        # EU open data
│   │   ├── camera.ts         # Italian Parliament
│   │   ├── senato.ts         # Italian Senate
│   │   └── schemas.ts        # Tool definitions
│   └── handlers/             # Generic handlers
│       ├── sparql.ts         # SPARQL queries
│       ├── rest-api.ts       # REST API calls
│       └── web-scraper.ts    # Web scraping
├── config/
│   └── sources.yaml          # Jurisdiction configuration
├── dist/                     # Compiled JavaScript
└── package.json              # npm metadata
```

## The 13 Legal Tools
1. **EUR-Lex** - EU directives, regulations, case law via SPARQL
2. **Normattiva** - Italian legislation search
3. **INPS** - Italian social security rates/data
4. **Circolari** - Italian tax guidance (Agenzia Entrate)
5. **AADE** - Greek tax/regulatory guidance
6. **dati.gov.it** - Italian open data catalog
7. **UK Legislation** - UK laws and statutory instruments
8. **Légifrance** - French legislation and codes
9. **BOE** - Spanish legislation (Boletín Oficial)
10. **Gesetze im Internet** - German federal laws
11. **EU Open Data Portal** - European datasets
12. **Camera dei Deputati** - Italian House debates/bills
13. **Senato della Repubblica** - Italian Senate activity

## Technology Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **MCP SDK**: @modelcontextprotocol/sdk v1.0.0
- **Data Parsing**: cheerio, pdf-parse
- **Web Access**: playwright-core
- **Config**: yaml
- **Package Manager**: npm