import { ComponentAnalysisReport, GitHubIssue, IssueAnalysis } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class ReportService {
  /**
   * Generate a markdown report for component analysis
   */
  generateMarkdownReport(report: ComponentAnalysisReport): string {
    const { component_name, analysis_date, total_issues, critical_issues, high_priority_issues, issues, summary } =
      report;

    let markdown = '';

    // Header
    markdown += `# ${component_name} Component Analysis Report\n\n`;
    markdown += `**Generated on:** ${new Date(analysis_date).toLocaleDateString()}\n\n`;

    // Summary Statistics
    markdown += `## 📊 Summary\n\n`;
    markdown += `- **Total Issues Analyzed:** ${total_issues}\n`;
    markdown += `- **Critical Issues:** ${critical_issues} 🔴\n`;
    markdown += `- **High Priority Issues:** ${high_priority_issues} 🟠\n`;
    markdown += `- **Medium/Low Priority Issues:** ${total_issues - critical_issues - high_priority_issues} 🟡\n\n`;

    // Critical Issues Section
    if (critical_issues > 0) {
      markdown += `## 🚨 Critical Issues\n\n`;
      markdown += `These issues prevent basic component usage or cause severe problems:\n\n`;

      const criticalIssues = issues.filter(
        (item) => item.analysis.is_critical || item.analysis.severity_level === 'critical'
      );

      criticalIssues.forEach((item, index) => {
        markdown += this.formatIssueSection(item.github_issue, item.analysis, index + 1, '🔴');
      });
    }

    // High Priority Issues Section
    const highPriorityIssues = issues.filter(
      (item) => item.analysis.severity_level === 'high' && !item.analysis.is_critical
    );
    if (highPriorityIssues.length > 0) {
      markdown += `## ⚠️ High Priority Issues\n\n`;
      markdown += `These issues significantly impact functionality but don't prevent basic usage:\n\n`;

      highPriorityIssues.forEach((item, index) => {
        markdown += this.formatIssueSection(item.github_issue, item.analysis, index + 1, '🟠');
      });
    }

    // Medium Priority Issues Section
    const mediumPriorityIssues = issues.filter((item) => item.analysis.severity_level === 'medium');
    if (mediumPriorityIssues.length > 0) {
      markdown += `## 📋 Medium Priority Issues\n\n`;
      markdown += `<details>\n<summary>Click to expand medium priority issues (${mediumPriorityIssues.length} issues)</summary>\n\n`;

      mediumPriorityIssues.forEach((item, index) => {
        markdown += this.formatIssueSection(item.github_issue, item.analysis, index + 1, '🟡', true);
      });

      markdown += `</details>\n\n`;
    }

    // Low Priority Issues Section
    const lowPriorityIssues = issues.filter((item) => item.analysis.severity_level === 'low');
    if (lowPriorityIssues.length > 0) {
      markdown += `## 📝 Low Priority Issues\n\n`;
      markdown += `<details>\n<summary>Click to expand low priority issues (${lowPriorityIssues.length} issues)</summary>\n\n`;

      lowPriorityIssues.forEach((item, index) => {
        markdown += this.formatIssueSection(item.github_issue, item.analysis, index + 1, '🟢', true);
      });

      markdown += `</details>\n\n`;
    }

    // Analysis Summary
    markdown += `## 🔍 Analysis Summary\n\n`;

    if (summary.most_critical_issues.length > 0) {
      markdown += `### Most Critical Issues\n`;
      summary.most_critical_issues.forEach((issue) => {
        markdown += `- ${issue}\n`;
      });
      markdown += `\n`;
    }

    if (summary.common_problems.length > 0) {
      markdown += `### Common Problems Identified\n`;
      summary.common_problems.forEach((problem) => {
        markdown += `- ${problem}\n`;
      });
      markdown += `\n`;
    }

    if (summary.recommended_actions.length > 0) {
      markdown += `### Recommended Actions\n`;
      summary.recommended_actions.forEach((action) => {
        markdown += `- ${action}\n`;
      });
      markdown += `\n`;
    }

    // Confidence Score Distribution
    markdown += `## 📈 Analysis Confidence\n\n`;
    const avgConfidence = issues.reduce((sum, item) => sum + item.analysis.confidence_score, 0) / issues.length;
    markdown += `**Average Confidence Score:** ${avgConfidence.toFixed(1)}%\n\n`;

    const confidenceDistribution = this.getConfidenceDistribution(issues);
    markdown += `**Confidence Distribution:**\n`;
    Object.entries(confidenceDistribution).forEach(([range, count]) => {
      markdown += `- ${range}: ${count} issues\n`;
    });
    markdown += `\n`;

    // Footer
    markdown += `---\n\n`;
    markdown += `*This report was generated automatically using GitHub API and OpenAI analysis.*\n`;
    markdown += `*Last updated: ${new Date(analysis_date).toISOString()}*\n`;

    return markdown;
  }

  /**
   * Format a single issue section
   */
  private formatIssueSection(
    issue: GitHubIssue,
    analysis: IssueAnalysis,
    index: number,
    emoji: string,
    compact: boolean = false
  ): string {
    let section = '';

    if (compact) {
      section += `### ${emoji} ${index}. [${issue.title}](${issue.html_url})\n\n`;
      section += `**Severity:** ${analysis.severity_level.toUpperCase()} | **Confidence:** ${
        analysis.confidence_score
      }%\n\n`;
      section += `${analysis.reasoning}\n\n`;
    } else {
      section += `### ${emoji} ${index}. [${issue.title}](${issue.html_url})\n\n`;
      section += `**Issue #${
        issue.number
      }** | **Severity:** ${analysis.severity_level.toUpperCase()} | **Confidence:** ${analysis.confidence_score}%\n\n`;

      // Labels
      if (issue.labels.length > 0) {
        section += `**Labels:** `;
        section += issue.labels.map((label) => `\`${label.name}\``).join(', ');
        section += `\n\n`;
      }

      // Analysis details
      section += `**Why this is ${analysis.severity_level} priority:**\n`;
      section += `${analysis.reasoning}\n\n`;

      if (analysis.affected_functionality.length > 0) {
        section += `**Affected Functionality:**\n`;
        analysis.affected_functionality.forEach((func) => {
          section += `- ${func}\n`;
        });
        section += `\n`;
      }

      section += `**Impact:** ${analysis.impact_description}\n\n`;

      // Issue details
      section += `**Created:** ${new Date(issue.created_at).toLocaleDateString()}\n`;
      section += `**Updated:** ${new Date(issue.updated_at).toLocaleDateString()}\n`;
      section += `**Comments:** ${issue.comments}\n`;
      section += `**State:** ${issue.state}\n\n`;
    }

    section += `---\n\n`;
    return section;
  }

  /**
   * Get confidence score distribution
   */
  private getConfidenceDistribution(issues: Array<{ analysis: IssueAnalysis }>): Record<string, number> {
    const distribution = {
      'High (80-100%)': 0,
      'Medium (60-79%)': 0,
      'Low (40-59%)': 0,
      'Very Low (0-39%)': 0,
    };

    issues.forEach((item) => {
      const score = item.analysis.confidence_score;
      if (score >= 80) distribution['High (80-100%)']++;
      else if (score >= 60) distribution['Medium (60-79%)']++;
      else if (score >= 40) distribution['Low (40-59%)']++;
      else distribution['Very Low (0-39%)']++;
    });

    return distribution;
  }

  /**
   * Save report to file
   */
  async saveReport(report: ComponentAnalysisReport, outputPath: string): Promise<void> {
    try {
      // Ensure output directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const markdown = this.generateMarkdownReport(report);
      fs.writeFileSync(outputPath, markdown, 'utf-8');

      console.log(`✅ Report saved to: ${outputPath}`);
    } catch (error) {
      console.error('Error saving report:', error);
      throw new Error(`Failed to save report: ${error}`);
    }
  }

  /**
   * Generate a JSON report as well
   */
  async saveJsonReport(report: ComponentAnalysisReport, outputPath: string): Promise<void> {
    try {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const jsonContent = JSON.stringify(report, null, 2);
      fs.writeFileSync(outputPath, jsonContent, 'utf-8');

      console.log(`✅ JSON report saved to: ${outputPath}`);
    } catch (error) {
      console.error('Error saving JSON report:', error);
      throw new Error(`Failed to save JSON report: ${error}`);
    }
  }

  /**
   * Generate a quick summary for console output
   */
  generateConsoleSummary(report: ComponentAnalysisReport): string {
    const { component_name, total_issues, critical_issues, high_priority_issues } = report;

    let summary = `\n📊 Analysis Summary for ${component_name}:\n`;
    summary += `   Total Issues: ${total_issues}\n`;
    summary += `   🔴 Critical: ${critical_issues}\n`;
    summary += `   🟠 High Priority: ${high_priority_issues}\n`;
    summary += `   🟡 Medium/Low: ${total_issues - critical_issues - high_priority_issues}\n`;

    if (critical_issues > 0) {
      summary += `\n⚠️  WARNING: ${critical_issues} critical issues found that may prevent basic component usage!\n`;
    }

    return summary;
  }
}
