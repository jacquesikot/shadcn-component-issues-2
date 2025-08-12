# Shadcn Component Issue Analyzer

A TypeScript tool that analyzes GitHub issues for shadcn/ui components and identifies critical issues using OpenAI's GPT models. This tool helps developers quickly identify which components have critical issues that might prevent basic usage or cause performance problems.

## Features

- 🔍 **Smart Issue Search**: Automatically searches GitHub for component-related issues using multiple search strategies
- 🤖 **AI-Powered Analysis**: Uses OpenAI's structured outputs to classify issue severity and criticality
- 📊 **Comprehensive Reports**: Generates detailed markdown and JSON reports with analysis results
- ⚡ **Batch Processing**: Efficiently analyzes multiple issues with rate limiting and error handling
- 🎯 **Critical Issue Detection**: Identifies issues that prevent basic component usage or cause severe problems
- 📈 **Confidence Scoring**: Provides confidence scores for each analysis to help with decision making

## Installation

1. Clone this repository:

```bash
git clone <repository-url>
cd shadcn-component-issues
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your API keys
```

## Environment Setup

Create a `.env` file with the following variables:

```env
# Required: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Optional: GitHub Personal Access Token (for higher rate limits)
GITHUB_TOKEN=your_github_token_here

# Optional: OpenAI Model (defaults to gpt-4-turbo-preview)
OPENAI_MODEL=gpt-4-turbo-preview

# Optional: Output directory (defaults to ./reports)
OUTPUT_DIR=./reports
```

### Getting API Keys

- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **GitHub Token**: Create at [GitHub Settings > Tokens](https://github.com/settings/tokens) (optional, but recommended for higher rate limits)

## Usage

### Command Line Interface

Analyze a specific component:

```bash
npm run analyze button
# or after building:
node dist/index.js analyze button
```

### Available Commands

#### Analyze Component

```bash
# Basic analysis
npm run analyze <component-name>

# With options
npm run analyze dialog --max-issues 100 --include-closed --verbose

# Save to specific file
npm run analyze button --output ./my-reports/button-analysis.md
```

**Options:**

- `-m, --max-issues <number>`: Maximum number of issues to analyze (default: 50)
- `-c, --include-closed`: Include closed issues in analysis
- `-o, --output <file>`: Custom output file path
- `-v, --verbose`: Enable verbose logging

#### List Available Components

```bash
npm run dev list-components
```

#### Setup Help

```bash
npm run dev setup
```

### Programmatic Usage

```typescript
import { ShadcnIssueAnalyzer } from './src/analyzer';

const analyzer = new ShadcnIssueAnalyzer(true); // verbose mode

const report = await analyzer.analyzeComponent({
  component: 'button',
  maxIssues: 50,
  includeClosedIssues: false,
  verbose: true,
});

await analyzer.saveReport(report);
console.log(`Found ${report.critical_issues} critical issues`);
```

## Report Structure

The tool generates two types of reports:

### Markdown Report

- **Summary Statistics**: Total, critical, and high-priority issue counts
- **Critical Issues Section**: Detailed analysis of issues that prevent basic usage
- **High Priority Issues**: Issues that significantly impact functionality
- **Medium/Low Priority Issues**: Collapsible sections for less severe issues
- **Analysis Summary**: AI-generated insights about common problems and recommendations
- **Confidence Distribution**: Analysis confidence statistics

### JSON Report

Structured data format containing:

- Component metadata
- Full issue details from GitHub API
- AI analysis results with confidence scores
- Summary insights and recommendations

## Issue Classification

The AI analyzes each issue and classifies it based on:

### Critical Issues 🔴

- Prevents component from rendering or functioning
- Causes application crashes
- Makes component completely unusable
- Severe performance issues
- Security vulnerabilities
- Breaks core accessibility features

### High Priority Issues 🟠

- Significantly impacts functionality but doesn't prevent basic usage
- Noticeable performance degradation
- Affects important but not core features
- Complex workarounds required

### Medium Priority Issues 🟡

- Affects edge cases or less common use cases
- Minor performance impacts
- Non-breaking visual issues
- Simple workarounds available

### Low Priority Issues 🟢

- Very specific edge cases
- Enhancement requests
- Minimal functional impact
- Cosmetic issues

## Examples

### Analyze Button Component

```bash
npm run analyze button
```

Sample output:

```
🔍 Shadcn Component Issue Analyzer v1.0.0

⏳ Searching for issues related to "button"...
✅ Found 23 issues to analyze
⏳ Analyzing issues with OpenAI...
✅ Analysis complete: 2 critical, 5 high priority
🚨 Found 2 critical issues that may prevent basic component usage!

📊 Analysis Summary for button:
   Total Issues: 23
   🔴 Critical: 2
   🟠 High Priority: 5
   🟡 Medium/Low: 16

✅ Reports saved:
  Markdown: ./reports/button-analysis-2024-01-15.md
  JSON: ./reports/button-analysis-2024-01-15.json
```

### Analyze Dialog with Options

```bash
npm run analyze dialog --max-issues 100 --include-closed --verbose
```

## Common Components

The tool supports analysis of all shadcn/ui components including:

**Form Controls**: button, input, label, textarea, select, checkbox, radio-group, switch, slider
**Layout**: card, separator, aspect-ratio, resizable, scroll-area
**Navigation**: tabs, accordion, breadcrumb, pagination, navigation-menu
**Overlay**: dialog, alert-dialog, sheet, popover, tooltip, dropdown-menu
**Feedback**: toast, alert, progress, skeleton
**Data Display**: table, avatar, badge, calendar, chart
\*\*And many more...

## Development

### Scripts

- `npm run build`: Build TypeScript to JavaScript
- `npm run dev`: Run with ts-node for development
- `npm start`: Run the built JavaScript version
- `npm run analyze`: Shortcut for building and running analysis

### Project Structure

```
src/
├── types/           # TypeScript interfaces and types
├── services/        # Core services (GitHub, OpenAI, Report)
├── utils/          # Utilities (Config, Logger)
├── analyzer.ts     # Main analyzer class
└── index.ts        # CLI entry point
```

## Error Handling

The tool includes comprehensive error handling:

- API rate limit monitoring
- Network error recovery
- Graceful degradation when AI analysis fails
- Detailed error logging and user feedback

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Troubleshooting

### Common Issues

**"OPENAI_API_KEY environment variable is required"**

- Make sure you've created a `.env` file with your OpenAI API key

**"GitHub API rate limit exceeded"**

- Add a GitHub personal access token to your `.env` file
- Wait for the rate limit to reset (usually 1 hour)

**"No issues found for component"**

- Check the component name spelling
- Try variations like "alert-dialog" vs "alertdialog"
- Some newer components might have fewer reported issues

**Analysis fails with timeout errors**

- Reduce the `--max-issues` parameter
- Check your internet connection
- Verify your OpenAI API key is valid and has sufficient credits

### Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Run with `--verbose` flag for detailed logs
3. Check that your API keys are valid
4. Open an issue on GitHub with error details
