# Shadcn Component Issue Analyzer - Usage Guide

This guide provides detailed instructions on how to use the Shadcn Component Issue Analyzer effectively.

## Quick Start

1. **Setup Environment**

   ```bash
   npm install
   cp .env.example .env
   # Add your OpenAI API key to .env
   npm run build
   ```

2. **Analyze Your First Component**

   ```bash
   npm run analyze button
   ```

3. **View Results**
   - Check the generated markdown report in `./reports/`
   - Review critical issues that need immediate attention

## Detailed Usage

### Command Structure

```bash
npm run analyze <component> [options]
```

### Component Names

Use the exact component names from shadcn/ui:

- ✅ `button` (correct)
- ✅ `alert-dialog` (correct)
- ❌ `Button` (incorrect - use lowercase)
- ❌ `alertdialog` (incorrect - use kebab-case)

### Analysis Options

#### `--max-issues <number>`

Controls how many issues to analyze (default: 50)

```bash
# Analyze up to 100 issues
npm run analyze dialog --max-issues 100

# Quick analysis with only 20 issues
npm run analyze button --max-issues 20
```

**Recommendation**: Start with 50 issues. Increase for comprehensive analysis or decrease for faster results.

#### `--include-closed`

Include closed issues in the analysis

```bash
npm run analyze select --include-closed
```

**Use when**: You want to understand historical problems or see if issues were properly resolved.

#### `--output <file>`

Specify custom output file location

```bash
npm run analyze input --output ./my-analysis/input-report.md
```

#### `--verbose`

Enable detailed logging for debugging

```bash
npm run analyze tooltip --verbose
```

**Use when**: Troubleshooting API issues or understanding the analysis process.

## Understanding Reports

### Report Sections

#### 1. Summary Statistics

```markdown
## 📊 Summary

- **Total Issues Analyzed:** 45
- **Critical Issues:** 3 🔴
- **High Priority Issues:** 8 🟠
- **Medium/Low Priority Issues:** 34 🟡
```

**What it means**: Quick overview of issue distribution. Focus on critical and high priority counts.

#### 2. Critical Issues Section

```markdown
## 🚨 Critical Issues

These issues prevent basic component usage or cause severe problems:

### 🔴 1. [Component crashes when prop is undefined](https://github.com/...)

**Issue #1234** | **Severity:** CRITICAL | **Confidence:** 95%
```

**What to do**:

- Review these issues immediately
- Consider alternative components or workarounds
- Check if issues affect your use case

#### 3. Analysis Summary

```markdown
### Most Critical Issues

- Component fails to render with TypeScript strict mode
- Memory leak in event handlers

### Common Problems Identified

- Props validation issues
- TypeScript compatibility problems
- Performance issues with large datasets

### Recommended Actions

- Use prop validation
- Test with TypeScript strict mode
- Implement virtualization for large lists
```

**How to use**: This AI-generated summary helps you understand patterns and take preventive actions.

## Best Practices

### 1. Regular Component Auditing

Create a workflow to regularly check components you use:

```bash
# Create a script to check your key components
#!/bin/bash
components=("button" "input" "dialog" "table" "select")
for component in "${components[@]}"; do
    echo "Analyzing $component..."
    npm run analyze "$component" --output "./reports/$component-$(date +%Y%m%d).md"
done
```

### 2. Pre-Implementation Checks

Before using a new component:

```bash
# Check for critical issues
npm run analyze new-component --max-issues 30
```

Review the report to understand potential issues before implementation.

### 3. Issue Prioritization

Focus your attention based on analysis results:

1. **Critical Issues (🔴)**: Address immediately or find alternatives
2. **High Priority (🟠)**: Plan fixes or workarounds
3. **Medium Priority (🟡)**: Monitor and fix when convenient
4. **Low Priority (🟢)**: Consider for future improvements

### 4. Confidence Score Interpretation

- **90-100%**: Very reliable analysis
- **70-89%**: Generally reliable, manual review recommended
- **50-69%**: Moderate confidence, definitely review manually
- **Below 50%**: Low confidence, manual analysis required

## Common Workflows

### Workflow 1: New Project Component Selection

```bash
# 1. List available components
npm run dev list-components

# 2. Analyze candidates
npm run analyze button --max-issues 30
npm run analyze input --max-issues 30

# 3. Compare reports and choose safer options
```

### Workflow 2: Existing Project Audit

```bash
# 1. Analyze all components you currently use
npm run analyze button --include-closed
npm run analyze dialog --include-closed
npm run analyze table --include-closed

# 2. Create action plan based on critical issues found
# 3. Implement fixes or workarounds
```

### Workflow 3: Troubleshooting Specific Issues

```bash
# If you're having problems with a component
npm run analyze problematic-component --verbose --max-issues 100
```

Look for issues matching your symptoms in the report.

## Advanced Usage

### Batch Analysis Script

Create `analyze-all.js`:

```javascript
const { ShadcnIssueAnalyzer } = require('./dist/analyzer');

async function analyzeMultipleComponents() {
  const analyzer = new ShadcnIssueAnalyzer(false);
  const components = ['button', 'input', 'dialog', 'select', 'table'];

  for (const component of components) {
    console.log(`Analyzing ${component}...`);
    const report = await analyzer.analyzeComponent({
      component,
      maxIssues: 50,
      includeClosedIssues: false,
    });

    await analyzer.saveReport(report);

    if (report.critical_issues > 0) {
      console.log(`⚠️ ${component}: ${report.critical_issues} critical issues found!`);
    }
  }
}

analyzeMultipleComponents().catch(console.error);
```

Run with: `node analyze-all.js`

### Custom Report Processing

```javascript
const fs = require('fs');

// Load and process JSON reports
const report = JSON.parse(fs.readFileSync('./reports/button-analysis-2024-01-15.json'));

// Extract only critical issues
const criticalIssues = report.issues.filter((item) => item.analysis.is_critical);

// Create custom summary
console.log(`Critical issues for ${report.component_name}:`);
criticalIssues.forEach((item) => {
  console.log(`- ${item.github_issue.title}`);
  console.log(`  Reason: ${item.analysis.reasoning}`);
});
```

## Troubleshooting

### Issue: "No issues found"

**Possible causes**:

- Component name typo
- Very new component with no reported issues
- All issues are closed and `--include-closed` not used

**Solutions**:

```bash
# Try with closed issues
npm run analyze component-name --include-closed

# Try alternative naming
npm run analyze alert-dialog  # instead of alertdialog
```

### Issue: "Rate limit exceeded"

**Solutions**:

1. Add GitHub token to `.env`
2. Reduce `--max-issues` parameter
3. Wait for rate limit reset

### Issue: "OpenAI analysis failed"

**Possible causes**:

- Invalid API key
- Insufficient OpenAI credits
- Network issues

**Solutions**:

1. Verify API key in `.env`
2. Check OpenAI account credits
3. Run with `--verbose` to see detailed errors

### Issue: Low confidence scores

**What it means**: AI is uncertain about the analysis

**Actions**:

1. Manually review issues with low confidence
2. Look for patterns in the issue descriptions
3. Consider the context of your specific use case

## Tips for Better Results

1. **Use descriptive component names**: Match exactly with shadcn/ui documentation
2. **Start with smaller analysis**: Use `--max-issues 20` for quick checks
3. **Include closed issues for comprehensive view**: Use `--include-closed` for thorough analysis
4. **Review confidence scores**: Focus on high-confidence critical issues first
5. **Check analysis date**: Issues and their relevance change over time
6. **Cross-reference with documentation**: Compare findings with official shadcn/ui docs

## Integration with Development Workflow

### Pre-commit Hook

Add component analysis to your pre-commit hooks:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run analyze-components && git add reports/"
    }
  }
}
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Analyze Components
  run: |
    npm run analyze button
    npm run analyze dialog
    # Fail if critical issues > threshold
    node check-critical-issues.js
```

This comprehensive guide should help you make the most of the Shadcn Component Issue Analyzer. Remember that the tool provides insights to help with decision-making, but human judgment is still essential for interpreting results in your specific context.
