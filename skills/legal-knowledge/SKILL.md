---
name: legal-knowledge
description: How to use the legal-knowledge MCP server to research laws, regulations, tax rules, bills and case law in the US (federal, all 50 states, Wyoming/Delaware business law), the EU, Italy, Greece, UK, France, Germany, Spain and Paraguay. Use when the user asks a legal, tax, company-formation, residency or compliance question for any of these jurisdictions, or names a statute, regulation or legal source.
---

# Legal Knowledge MCP

Research tool, not legal advice. Every answer cites the source URL and tells the user to verify the official text (and consult a licensed professional for decisions).

## Setup

```json
{
  "mcpServers": {
    "legal-knowledge": {
      "command": "npx",
      "args": ["-y", "legal-knowledge-mcp"],
      "env": {
        "GOVINFO_API_KEY": "optional — free at https://api.data.gov/signup/",
        "OPENSTATES_API_KEY": "optional — free at https://openstates.org/accounts/signup/",
        "COURTLISTENER_API_TOKEN": "optional — free at https://www.courtlistener.com/sign-in/"
      }
    }
  }
}
```

Without keys, every tool works except `legal_search_us_states` and `legal_search_us_caselaw`. Those two return `CONFIGURATION_ERROR` with the signup link; pass that link on to the user.

## Which tool

| Question about | Tool |
|---|---|
| US federal law, IRS/tax, LLC tax treatment, Form 5472, BOI, immigration, Wyoming or Delaware LLCs | `legal_search_us` |
| Exact US Code section, public law or congressional bill text | `legal_search_us_code` (`collection`: uscode, public_laws, bills, cfr) |
| A bill in a US state legislature | `legal_search_us_states` (`state`: "wy", "de", …) |
| US court decisions | `legal_search_us_caselaw` (`court`: "wyo", "del", "scotus", …) |
| EU regulations and directives | `legal_query_eurlex`, `legal_query_eudata` |
| Italian laws, tax circulars, social security, open data, parliament | `legal_search_normattiva`, `legal_search_circolari`, `legal_query_inps`, `legal_query_datigov`, `legal_query_camera`, `legal_query_senato` |
| Greek tax (AADE) | `legal_search_aade` |
| UK / France / Germany / Spain | `legal_search_uk`, `legal_search_france`, `legal_search_germany`, `legal_search_spain` |
| Paraguay laws, tax (DNIT), open data | `legal_search_paraguay`, `legal_query_paraguay_dnit`, `legal_query_paraguay_opendata` |

## How to search

1. Start with the jurisdiction's main tool. Results tagged `pre-indexed` are curated key laws, so read those first.
2. Live results (eCFR, Federal Register, GovInfo, …) are keyword matches. Use legal terms ("disregarded entity", "charging order", "6038A") rather than plain-English questions, and run 2-3 phrasings.
3. Drill down: once a statute is found, use `legal_search_us_code` for its text, `legal_search_us_states` for pending changes, `legal_search_us_caselaw` for how courts read it.
4. Cross-border questions (e.g. an Italian resident owning a Wyoming LLC) need both jurisdictions: search each one and also check the tax treaty.
5. If `data.warnings` is present, a live source failed. Say so, and don't treat the missing results as "no law exists".
6. Answer with: the rule, its citation (`reference`), the official `url`, and its date. Flag anything that may have changed since that date.

## Example queries

- `legal_search_us` `{ "query": "foreign owned single member llc form 5472" }`
- `legal_search_us` `{ "query": "wyoming llc annual report", "topic": "company" }`
- `legal_search_us_code` `{ "query": "beneficial ownership information reporting", "collection": "uscode" }`
- `legal_search_us_states` `{ "query": "limited liability company", "state": "wy" }`
- `legal_search_us_caselaw` `{ "query": "single member llc charging order", "court": "wyo" }`
