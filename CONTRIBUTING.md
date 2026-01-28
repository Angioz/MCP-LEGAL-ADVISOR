# Contributing to Legal Knowledge MCP

Thank you for your interest in contributing to this project! This guide will help you get started.

## Ways to Contribute

- **Add new jurisdictions** - Expand legal coverage to new countries
- **Improve existing tools** - Enhance data quality and reliability
- **Fix bugs** - Help resolve issues
- **Improve documentation** - Make the project more accessible
- **Report issues** - Help identify problems

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/Angioz/MCP-LEGAL-ADVISOR.git
cd MCP-LEGAL-ADVISOR

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

## Adding a New Jurisdiction

To add support for a new country's legal data:

1. **Research the data source**
   - Find official government legal databases
   - Check if they have public APIs (REST, SPARQL, CKAN)
   - Document the endpoint URLs and data formats

2. **Create the tool file**
   - Add a new file in `src/tools/` (e.g., `france.ts`)
   - Follow the existing tool patterns
   - Implement the handler function

3. **Register the tool**
   - Add the tool schema to `src/tools/schemas.ts`
   - Register the handler in `src/tools/index.ts`
   - Add types to `src/types.ts`

4. **Update configuration**
   - Add the new source to `config/sources.yaml`

5. **Test thoroughly**
   - Verify the tool returns real data
   - Test error handling
   - Document example queries

## Code Style Guidelines

- Use TypeScript with strict typing
- Follow existing code patterns
- No `console.log` in production code
- Handle errors gracefully with informative messages
- Add JSDoc comments for public functions

## Pull Request Process

1. **Fork the repository** and create a feature branch
2. **Make your changes** following the guidelines above
3. **Test your changes** - ensure `npm run build` succeeds
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

### PR Title Format

Use clear, descriptive titles:
- `feat: Add French Legifrance legal tool`
- `fix: Handle timeout errors in EUR-Lex queries`
- `docs: Update installation guide for Windows`

### PR Description Template

```
## Summary
Brief description of what this PR does.

## Changes
- List of specific changes made

## Testing
How you tested these changes.

## Checklist
- [ ] Code builds without errors
- [ ] New tool returns real data (not mocked)
- [ ] Error handling implemented
- [ ] Documentation updated
```

## Testing Requirements

Before submitting a PR:

1. Run `npm run build` - must complete without errors
2. Test your tool manually with real queries
3. Verify error messages are helpful
4. Check that responses follow the existing format

## Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version)
- Any error messages

## Questions?

- Open a GitHub Discussion for general questions
- Open an Issue for bugs or feature requests

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
