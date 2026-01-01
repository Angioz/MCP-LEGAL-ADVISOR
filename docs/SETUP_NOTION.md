# Setting Up Notion for the Financial Advisor Agent

This guide explains how to set up Notion databases for the financial advisor agent's persistent memory.

## Prerequisites

1. A Notion account
2. Notion MCP server installed ([see official docs](https://github.com/anthropic/notion-mcp))

## Step 1: Create a Parent Page

Create a new page in Notion called "Financial Advisor" (or your preferred name). This will contain your databases.

## Step 2: Create the Memories Database

In your parent page, create a new **inline database** with these properties:

| Property Name | Property Type | Options |
|---------------|---------------|---------|
| Session Title | Title | (default) |
| Date | Date | |
| Summary | Text | |
| Decisions Made | Text | |
| Open Items | Text | |
| Insights | Text | |
| Session Type | Select | Strategy, Research, Decision, Review, Planning |

## Step 3: Create the Changelog Database

Create another **inline database** with these properties:

| Property Name | Property Type | Options |
|---------------|---------------|---------|
| Decision | Title | (default) |
| Date | Date | |
| Category | Select | STRATEGY, FUNDING, TAX, CORPORATE, COMPLIANCE, MILESTONE, RESEARCH |
| Rationale | Text | |
| Next Steps | Text | |
| Status | Select | Active, Completed, Superseded |

## Step 4: Get Your Database IDs

1. Open each database in Notion
2. Click "..." menu → "Copy link"
3. The link format is: `https://www.notion.so/DATABASE_ID?v=VIEW_ID`
4. Extract the DATABASE_ID (the long alphanumeric string before `?v=`)

Alternatively, use the Notion MCP to fetch the database:

```
mcp__notion__notion-fetch id="your-page-url"
```

This will show the `data-source` URLs in the format `collection://DATA_SOURCE_ID`.

## Step 5: Update Your Agent Configuration

Edit `agents/financial-advisor/advisor.agent.md` and replace the placeholder IDs:

```markdown
### Database IDs (REPLACE WITH YOUR OWN)

| Database | Data Source ID |
|----------|----------------|
| **Memories** | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |  ← Your ID here
| **Changelog** | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |  ← Your ID here
```

## Step 6: Test the Connection

Start a session with the agent and verify it can:

1. Read from the Memories database
2. Write to the Changelog database

```
/advisor
> log

[Agent should create a new entry in your Changelog database]
```

## Troubleshooting

### "Database not found"

- Verify the database ID is correct
- Ensure Notion MCP has access to the database
- Check that the database is shared with your Notion integration

### "Permission denied"

- The Notion MCP needs to be connected to your workspace
- Verify your Notion integration has access to the pages/databases

### Properties not matching

- Ensure property names match exactly (case-sensitive)
- Check property types match the expected format

## Optional: Database Views

You can create useful views in your databases:

### Memories Database Views

- **Recent Sessions**: Sort by Date descending
- **By Type**: Group by Session Type
- **Open Items**: Filter where Open Items is not empty

### Changelog Database Views

- **Active Decisions**: Filter where Status = Active
- **By Category**: Group by Category
- **Timeline**: Calendar view by Date

## Security Notes

- Your Notion databases contain your personal/business data
- The agent template in the public repo contains NO personal data
- Only your local copy has your actual database IDs
- Never commit your personalized agent files to a public repo
