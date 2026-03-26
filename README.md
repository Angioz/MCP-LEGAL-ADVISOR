# Legal Knowledge MCP Server

[![npm version](https://img.shields.io/npm/v/legal-knowledge-mcp.svg)](https://www.npmjs.com/package/legal-knowledge-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io/)

An MCP (Model Context Protocol) server that gives Claude access to **13 legal data tools** across **7 jurisdictions** - EU, Italy, Greece, UK, France, Germany, and Spain.

Ask Claude questions about regulations, tax law, company formation, and compliance - get answers sourced directly from official government databases.

---

## Quick Start (5 minutes)

### Prerequisites
- [Node.js 18+](https://nodejs.org/) installed
- [Claude Desktop](https://claude.ai/download) or [Claude Code CLI](https://claude.ai/code)

### 1. Install

```bash
npm install -g legal-knowledge-mcp
```

**Verify it works:**
```bash
legal-knowledge-mcp
# Expected output: Legal Knowledge MCP server running on stdio
```

> **Note for Italian law queries (Normattiva):** This tool uses a headless browser. Install the browser once after package install:
> ```bash
> npx playwright install chromium
> ```
> All other tools work without this step.

### 2. Configure Claude

**Claude Desktop — Mac:**
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`

**Claude Desktop — Windows:**
Edit `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "legal-knowledge": {
      "command": "legal-knowledge-mcp"
    }
  }
}
```

**Claude Code CLI:**
```bash
claude mcp add legal-knowledge -- legal-knowledge-mcp
```

**Restart Claude Desktop** after editing the config.

### 3. Ask Claude

```
"What are the requirements to form an SRL in Italy?"
"Search UK legislation for data protection"
"Find German company law GmbHG"
"What are Greek IKE tax rates?"
```

---

## Supported Jurisdictions & Tools

| Jurisdiction | Tool | Source | Data Type |
|--------------|------|--------|-----------|
| **EU** | `legal_query_eurlex` | EUR-Lex | Directives, regulations, case law |
| **EU** | `legal_query_eudata` | EU Open Data Portal | European datasets |
| **Italy** | `legal_search_normattiva` | Normattiva.it | Laws, decrees, regulations |
| **Italy** | `legal_query_inps` | INPS OpenData | Social security rates |
| **Italy** | `legal_search_circolari` | Agenzia Entrate | Tax guidance, circolari |
| **Italy** | `legal_query_datigov` | dati.gov.it | Public administration data |
| **Italy** | `legal_query_camera` | Camera dei Deputati | Parliamentary bills, debates |
| **Italy** | `legal_query_senato` | Senato della Repubblica | Senate legislation |
| **Greece** | `legal_search_aade` | AADE | Tax guidance, IKE, EFKA |
| **UK** | `legal_search_uk` | legislation.gov.uk | Acts, Statutory Instruments |
| **France** | `legal_search_france` | Legifrance | Codes, laws, decrets |
| **Germany** | `legal_search_germany` | Gesetze im Internet | Federal laws (BGB, HGB, GmbHG) |
| **Spain** | `legal_search_spain` | BOE | Official gazette, legislation |

---

## Use Cases

### Startup Founders
```
"What legal structure options exist for a tech startup in Italy?"
"Compare UK Ltd vs German GmbH requirements"
"What are the GDPR requirements for storing user data?"
```

### Tax & Compliance
```
"Find Italian VAT rates for digital services"
"Search Greek tax guidance on foreign income"
"What are French employer social contributions?"
```

### Legal Research
```
"Search EU directives on artificial intelligence"
"Find UK Data Protection Act provisions"
"What does German commercial code say about partnerships?"
```

### Cross-Border Business
```
"What are the requirements to hire employees in Spain?"
"Search Italian labor law for remote work regulations"
"Find EU regulations on cross-border payments"
```

---

## Installation Options

### Option 1: Global npm install (Recommended)

```bash
npm install -g legal-knowledge-mcp
```

### Option 2: From Source

```bash
git clone https://github.com/Angioz/MCP-LEGAL-ADVISOR.git
cd MCP-LEGAL-ADVISOR
npm install
npm run build
```

### Option 3: npx (No install)

```bash
npx legal-knowledge-mcp
```

---

## Configuration

### Claude Desktop

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "legal-knowledge": {
      "command": "legal-knowledge-mcp"
    }
  }
}
```

> **Windows users:** If `legal-knowledge-mcp` is not found, use the full path:
> ```json
> {
>   "mcpServers": {
>     "legal-knowledge": {
>       "command": "node",
>       "args": ["C:\\Users\\YourName\\AppData\\Roaming\\npm\\node_modules\\legal-knowledge-mcp\\dist\\index.js"]
>     }
>   }
> }
> ```

### Claude Code CLI (Recommended)

```bash
# Add to current project (one command)
claude mcp add legal-knowledge -- legal-knowledge-mcp
```

### Project-level (.mcp.json)

For project-specific configuration:

```json
{
  "mcpServers": {
    "legal-knowledge": {
      "command": "legal-knowledge-mcp"
    }
  }
}
```

### Legacy Claude Code CLI

```bash
# Add to current project
claude mcp add legal-knowledge-mcp

# Or specify path
claude mcp add legal-knowledge -- node /path/to/dist/index.js
```

---

## Tool Reference

### EUR-Lex (`legal_query_eurlex`)

Query EU legislation via SPARQL endpoint.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Natural language query |
| `document_type` | enum | No | directive, regulation, decision, case_law, all |
| `limit` | number | No | Max results (default: 10) |
| `sparql` | string | No | Raw SPARQL for advanced queries |

### Normattiva (`legal_search_normattiva`)

Search Italian legislation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `act_type` | enum | No | legge, decreto_legislativo, decreto_legge, dpr, all |
| `year` | number | No | Year of act |
| `number` | number | No | Act number |

### INPS (`legal_query_inps`)

Query Italian social security data.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Natural language query |
| `dataset` | string | No | Dataset ID or search term |

### Agenzia Entrate (`legal_search_circolari`)

Search Italian tax guidance.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `topic` | enum | No | redditi, iva, registro, successioni, agevolazioni, all |
| `year` | number | No | Year |
| `number` | string | No | Circolare number (e.g., "33/E") |

### AADE (`legal_search_aade`)

Search Greek tax authority guidance.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `topic` | enum | No | income_tax, vat, efka, ike, all |

### dati.gov.it (`legal_query_datigov`)

Query Italian open data catalog.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `organization` | string | No | Publishing organization filter |

### Camera dei Deputati (`legal_query_camera`)

Query Italian Chamber of Deputies.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `legislature` | number | No | Legislature number (e.g., 19) |
| `document_type` | enum | No | atto, interrogazione, mozione, all |
| `limit` | number | No | Max results (default: 10) |

### Senato (`legal_query_senato`)

Query Italian Senate.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `legislature` | number | No | Legislature number |
| `document_type` | enum | No | ddl, atto, interrogazione, all |
| `limit` | number | No | Max results (default: 10) |

### EU Open Data (`legal_query_eudata`)

Query EU Open Data Portal.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `category` | string | No | Dataset category |
| `publisher` | string | No | Publishing organization |
| `limit` | number | No | Max results (default: 10) |

### UK Legislation (`legal_search_uk`)

Search UK legislation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `type` | enum | No | ukpga (Public Act), uksi (Statutory Instrument), asp (Scottish Act), all |
| `year` | number | No | Year of legislation |
| `limit` | number | No | Max results (default: 10) |

### Legifrance (`legal_search_france`)

Search French legislation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `type` | enum | No | loi, ordonnance, decret, arrete, code, all |
| `date_from` | string | No | Start date (YYYY-MM-DD) |
| `date_to` | string | No | End date (YYYY-MM-DD) |
| `limit` | number | No | Max results (default: 10) |

### Gesetze im Internet (`legal_search_germany`)

Search German federal laws.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `law_code` | string | No | Law abbreviation (GmbHG, HGB, BGB, AktG) |
| `limit` | number | No | Max results (default: 10) |

### BOE (`legal_search_spain`)

Search Spanish legislation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search terms |
| `department` | string | No | Government department |
| `date_from` | string | No | Start date (YYYY-MM-DD) |
| `date_to` | string | No | End date (YYYY-MM-DD) |
| `limit` | number | No | Max results (default: 10) |

---

## Troubleshooting

### All tools return `SOURCE_DISABLED`

**Cause:** Configuration file not found and defaults not applied (affects v1.0.0 only — fixed in v1.0.1+).

**Fix:** Upgrade to the latest version:
```bash
npm install -g legal-knowledge-mcp@latest
```

### `legal_search_normattiva` fails with browser/executable error

**Cause:** Playwright's Chromium browser is not installed on your machine.

**Fix:** Run once after installing the package:
```bash
npx playwright install chromium
```

### "MCP server not found" or "command not found"

**Cause:** npm global bin directory not in PATH.

**Fix:**
```bash
# Find npm global bin directory
npm config get prefix

# Add to PATH (Mac/Linux - add to ~/.bashrc or ~/.zshrc)
export PATH="$PATH:$(npm config get prefix)/bin"

# Windows - add to System Environment Variables
# Usually: C:\Users\{username}\AppData\Roaming\npm
```

### "Connection refused" or "Server not responding"

**Cause:** Server crashed or MCP configuration incorrect.

**Fix:**
1. Test the server directly:
   ```bash
   legal-knowledge-mcp
   # Should output: "Legal Knowledge MCP server running on stdio"
   ```
2. Check Claude settings JSON is valid (use jsonlint.com)
3. Restart Claude Desktop after config changes

### "No results found" for queries

**Cause:** Query too specific or source temporarily unavailable.

**Fix:**
- Try broader search terms
- Check if the source website is accessible in your browser
- Some sources (EUR-Lex, UK legislation) work best with English queries
- Italian sources work best with Italian terms

### "SPARQL endpoint timeout" (EU Data)

**Cause:** EU Open Data Portal occasionally has CDN issues.

**Fix:**
- This is an external service issue, not a bug
- Try again later or use `legal_query_eurlex` for EU law queries instead

### Tools not appearing in Claude

**Cause:** MCP server not properly registered.

**Fix:**
1. Verify config file location is correct for your OS
2. Ensure JSON syntax is valid (no trailing commas)
3. Restart Claude Desktop completely (quit and reopen)
4. Check Claude's MCP panel shows "legal-knowledge" as connected

### Windows-specific issues

**Cause:** Path separators or execution policy.

**Fix:**
```powershell
# If npx doesn't work, try explicit path
node "C:\Users\{username}\AppData\Roaming\npm\node_modules\legal-knowledge-mcp\dist\index.js"

# Or set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Development

```bash
# Clone repository
git clone https://github.com/Angioz/MCP-LEGAL-ADVISOR.git
cd MCP-LEGAL-ADVISOR

# Install dependencies
npm install

# Build
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev

# Run server
npm start
```

### Architecture

```
src/
├── index.ts              # Entry point
├── server.ts             # MCP server setup
├── types.ts              # TypeScript types
├── tools/
│   ├── index.ts          # Tool registry
│   ├── schemas.ts        # JSON schemas (13 tools)
│   ├── eurlex.ts         # EU law (SPARQL)
│   ├── normattiva.ts     # Italian law
│   ├── inps.ts           # Italian social security
│   ├── agenzia-entrate.ts # Italian tax
│   ├── aade.ts           # Greek tax
│   ├── datigov.ts        # Italian open data
│   ├── camera.ts         # Italian Parliament (Chamber)
│   ├── senato.ts         # Italian Parliament (Senate)
│   ├── eudata.ts         # EU Open Data
│   ├── uk-legislation.ts # UK law
│   ├── legifrance.ts     # French law
│   ├── germany.ts        # German law
│   └── spain-boe.ts      # Spanish law
└── config/
    ├── index.ts          # Config loader
    └── sources.ts        # Source definitions
```

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Areas of interest:
- Additional jurisdiction support (US, Canada, Australia, etc.)
- Improved parsing for complex legal documents
- Caching optimizations
- Additional language support

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features.

**Phase 1** (Current): Foundation - 13 tools, 7 jurisdictions
**Phase 2**: LinkedIn launch, community building
**Phase 3**: Global expansion to 50+ jurisdictions

---

## Related Resources

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [Claude Desktop](https://claude.ai/download) - Claude desktop app
- [MCP Servers Directory](https://github.com/modelcontextprotocol/servers) - Other MCP servers

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Disclaimer

This tool provides access to public legal sources for **informational purposes only**. It does not constitute legal advice. Always verify information with qualified legal professionals before making legal or financial decisions.

The accuracy and completeness of data depends on the source government databases. This project is not affiliated with or endorsed by any government entity.

---

## Support

- [GitHub Issues](https://github.com/Angioz/MCP-LEGAL-ADVISOR/issues) - Bug reports and feature requests
- [Discussions](https://github.com/Angioz/MCP-LEGAL-ADVISOR/discussions) - Questions and community chat

---

Made with care for founders navigating legal complexity.
