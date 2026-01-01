# Financial Advisor Agent Template

> AI-powered financial strategist for international business structuring

This is a **template** agent that uses the legal-knowledge MCP to provide financial advisory capabilities. Customize it for your specific situation.

## Features

- Cross-border tax optimization research
- International business formation guidance
- Startup funding program lookup
- Corporate compliance tracking
- Persistent memory via Notion integration

## Setup

### 1. Install Dependencies

This agent requires:
- **legal-knowledge MCP** (this repo)
- **Notion MCP** ([official Notion MCP](https://github.com/anthropic/notion-mcp))

### 2. Create Notion Databases

Create two databases in your Notion workspace:

#### Memories Database
| Property | Type |
|----------|------|
| Session Title | Title |
| Date | Date |
| Summary | Text |
| Decisions Made | Text |
| Open Items | Text |
| Insights | Text |
| Session Type | Select (Strategy, Research, Decision, Review, Planning) |

#### Changelog Database
| Property | Type |
|----------|------|
| Decision | Title |
| Date | Date |
| Category | Select (STRATEGY, FUNDING, TAX, CORPORATE, COMPLIANCE, MILESTONE, RESEARCH) |
| Rationale | Text |
| Next Steps | Text |
| Status | Select (Active, Completed, Superseded) |

### 3. Update Database IDs

Edit `advisor.agent.md` and replace the placeholder database IDs with your actual Notion database IDs.

### 4. Customize Instructions

Edit `instructions.md` to:
- Add your principal profile
- Set your specific goals
- Configure communication preferences

## Usage

Copy this folder to your project's `.claude/agents/` directory, then invoke:

```
/advisor
```

## Files

| File | Purpose |
|------|---------|
| `advisor.agent.md` | Main agent definition |
| `instructions.md` | Core protocols and directives |
| `dashboard.md` | Mission progress template |
| `knowledge/` | Reference documents |

## Customization

This template is designed for EU/Mediterranean jurisdictions. The legal-knowledge MCP provides:

| Tool | Jurisdiction |
|------|-------------|
| `legal_query_eurlex` | EU (directives, regulations) |
| `legal_search_normattiva` | Italy (laws, decrees) |
| `legal_search_circolari` | Italy (tax guidance) |
| `legal_query_inps` | Italy (social security) |
| `legal_search_aade` | Greece (tax, IKE, EFKA) |
| `legal_query_datigov` | Italy (open data) |

## License

MIT
