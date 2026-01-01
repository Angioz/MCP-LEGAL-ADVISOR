# Legal Knowledge MCP Server

An MCP (Model Context Protocol) server that provides Claude with access to authoritative legal and regulatory sources across EU and Mediterranean jurisdictions.

## Features

| Tool | Source | Jurisdiction |
|------|--------|--------------|
| `legal_query_eurlex` | EUR-Lex SPARQL | EU (directives, regulations, case law) |
| `legal_search_normattiva` | Normattiva.it | Italy (laws, decrees) |
| `legal_search_circolari` | Agenzia Entrate | Italy (tax guidance, circolari) |
| `legal_query_inps` | INPS OpenData | Italy (social security) |
| `legal_search_aade` | AADE Portal | Greece (tax, IKE, EFKA) |
| `legal_query_datigov` | dati.gov.it | Italy (public data) |

## Installation

### Option 1: npm (recommended)

```bash
npm install -g @anthropic/legal-knowledge-mcp
```

### Option 2: From source

```bash
git clone https://github.com/YOUR_USERNAME/legal-knowledge-mcp
cd legal-knowledge-mcp
npm install
npm run build
```

## Configuration

Add to your Claude MCP configuration:

### Claude Desktop (`~/.claude/settings.json`)

```json
{
  "mcpServers": {
    "legal-knowledge": {
      "command": "legal-knowledge-mcp"
    }
  }
}
```

### Or with local path (`.mcp.json` in project)

```json
{
  "mcpServers": {
    "legal-knowledge": {
      "command": "node",
      "args": ["/path/to/legal-knowledge-mcp/dist/index.js"]
    }
  }
}
```

## Usage

Once configured, Claude can use these tools automatically:

```
"Search Italian law for startup innovativa requirements"
→ Uses legal_search_normattiva

"What are the EU GDPR requirements for data processing?"
→ Uses legal_query_eurlex

"Find INPS contribution rates for 2025"
→ Uses legal_query_inps

"Search Greek tax guidance on IKE companies"
→ Uses legal_search_aade
```

## Tool Details

### EUR-Lex (`legal_query_eurlex`)

Query EU legislation via SPARQL endpoint.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Natural language query |
| `document_type` | enum | directive, regulation, decision, case_law, all |
| `limit` | number | Max results (default: 10) |
| `sparql` | string | Raw SPARQL for advanced queries |

### Normattiva (`legal_search_normattiva`)

Search Italian legislation.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search terms |
| `act_type` | enum | legge, decreto_legislativo, decreto_legge, dpr, all |
| `year` | number | Year of act |
| `number` | number | Act number |

### Agenzia Entrate (`legal_search_circolari`)

Search Italian tax circolari and risoluzioni.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search terms |
| `topic` | enum | redditi, iva, registro, successioni, agevolazioni, all |
| `year` | number | Year |
| `number` | string | Circolare number (e.g., "33/E") |

### INPS (`legal_query_inps`)

Query Italian social security data.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Natural language query |
| `dataset` | string | Dataset ID or search term |

### AADE (`legal_search_aade`)

Search Greek tax authority guidance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search terms |
| `topic` | enum | income_tax, vat, efka, ike, all |

### dati.gov.it (`legal_query_datigov`)

Query Italian open data catalog.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search terms |
| `organization` | string | Publishing organization filter |

## Included Agent Template

This repo includes a **Financial Advisor** agent template that uses this MCP:

```
agents/financial-advisor/
├── README.md           # Setup instructions
├── advisor.agent.md    # Agent definition
├── instructions.md     # Core protocols
├── dashboard.md        # Progress template
└── knowledge/          # Reference documents
```

See [agents/financial-advisor/README.md](agents/financial-advisor/README.md) for setup.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run
npm start
```

## Architecture

```
src/
├── index.ts           # Entry point
├── server.ts          # MCP server setup
├── types.ts           # TypeScript types
├── tools/
│   ├── index.ts       # Tool registry
│   ├── schemas.ts     # JSON schemas
│   ├── eurlex.ts      # EUR-Lex implementation
│   ├── normattiva.ts  # Normattiva implementation
│   ├── agenzia-entrate.ts
│   ├── inps.ts
│   ├── aade.ts
│   └── datigov.ts
└── config/
    └── sources.ts     # Source configurations
```

## Contributing

Contributions welcome! Areas of interest:

- Additional jurisdiction support
- Improved parsing for complex documents
- Caching optimizations
- Additional agent templates

## License

MIT

## Disclaimer

This tool provides access to public legal sources for informational purposes. It does not constitute legal advice. Always verify information with qualified professionals before making legal or financial decisions.
