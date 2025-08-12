# Demo: Shadcn Issue Analyzer

This demo shows how the Shadcn Issue Analyzer works to identify critical issues in shadcn/ui components.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment:**

   ```bash
   npm run setup
   # Edit .env file with your API keys
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Demo Commands

### 1. List Available Components

```bash
npm run list
```

### 2. Analyze a Popular Component (Button)

```bash
npm run analyze button --max-issues 20 --verbose
```

Expected output:

```
🔍 Shadcn Component Issue Analyzer v1.0.0

⏳ Searching for issues related to "button"...
✅ Found 15 issues to analyze
⏳ Analyzing issues with OpenAI...
✅ Analysis complete: 1 critical, 3 high priority

📊 Analysis Summary for button:
   Total Issues: 15
   🔴 Critical: 1
   🟠 High Priority: 3
   🟡 Medium/Low: 11

✅ Reports saved:
  Markdown: ./reports/button-analysis-2024-01-15.md
  JSON: ./reports/button-analysis-2024-01-15.json
```

### 3. Analyze a Complex Component (Dialog)

```bash
npm run analyze dialog --max-issues 30 --include-closed
```

### 4. Quick Component Check

```bash
npm run analyze select --max-issues 10
```

## Sample Report Structure

The generated markdown report will include:

```markdown
# button Component Analysis Report

**Generated on:** 1/15/2024

## 📊 Summary

- **Total Issues Analyzed:** 15
- **Critical Issues:** 1 🔴
- **High Priority Issues:** 3 🟠
- **Medium/Low Priority Issues:** 11 🟡

## 🚨 Critical Issues

### 🔴 1. [Button component crashes with undefined children](https://github.com/shadcn-ui/ui/issues/1234)

**Issue #1234** | **Severity:** CRITICAL | **Confidence:** 95%

**Why this is critical priority:**
This issue prevents the button component from rendering when the children prop is undefined, causing the entire application to crash. This is a fundamental usage pattern that should be supported.

**Affected Functionality:**

- Basic button rendering
- Form submissions
- User interactions

**Impact:** Applications crash when button is used without children prop, preventing basic usage of the component.

## ⚠️ High Priority Issues

### 🟠 1. [Button focus styles not working with custom variants](https://github.com/shadcn-ui/ui/issues/5678)

...

## 🔍 Analysis Summary

### Most Critical Issues

- Button component crashes with undefined children
- Memory leak in button event handlers
- TypeScript errors with custom button variants

### Common Problems Identified

- Props validation issues
- Focus management problems
- Custom styling conflicts

### Recommended Actions

- Always provide children prop or default text
- Test with TypeScript strict mode
- Use proper event handler cleanup
```

## Understanding the Analysis

### Severity Levels

- **🔴 Critical**: Prevents basic component usage, causes crashes
- **🟠 High**: Significant functionality issues, complex workarounds needed
- **🟡 Medium**: Edge cases, minor issues, simple workarounds available
- **🟢 Low**: Cosmetic issues, enhancements, very specific edge cases

### Confidence Scores

- **90-100%**: Very reliable analysis, act on these immediately
- **70-89%**: Generally reliable, review manually
- **50-69%**: Moderate confidence, definitely investigate
- **Below 50%**: Low confidence, manual analysis required

## Example Use Cases

### Pre-Implementation Check

Before using a new component in your project:

```bash
npm run analyze tooltip --max-issues 30
```

Review critical issues to understand potential problems.

### Troubleshooting Existing Issues

If you're having problems with a component:

```bash
npm run analyze problematic-component --verbose --include-closed
```

Look for issues matching your symptoms.

### Regular Audits

Periodically check components you rely on:

```bash
npm run analyze button
npm run analyze input
npm run analyze dialog
```

## Tips for Better Results

1. **Start small**: Use `--max-issues 20` for quick checks
2. **Use verbose mode**: Add `--verbose` for detailed logging
3. **Include closed issues**: Use `--include-closed` for comprehensive analysis
4. **Check confidence scores**: Focus on high-confidence critical issues
5. **Manual verification**: Always verify critical findings manually

## Next Steps

After running the demo:

1. Review the generated reports in the `./reports/` directory
2. Try analyzing components you actually use in your projects
3. Set up regular component audits in your development workflow
4. Use the JSON reports for programmatic analysis

The tool helps you make informed decisions about component usage, but human judgment is still essential for interpreting results in your specific context.
