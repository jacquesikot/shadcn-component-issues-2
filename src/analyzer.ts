import { GitHubService } from './services/github';
import { OpenAIService } from './services/openai';
import { ReportService } from './services/report';
import { ConfigService } from './utils/config';
import { Logger } from './utils/logger';
import {
  ComponentAnalysisReport,
  AnalyzeOptions,
  OpenAIIssueAnalysisRequest,
  GitHubIssue,
  IssueAnalysis,
} from './types';

export class ShadcnIssueAnalyzer {
  private githubService: GitHubService;
  private openaiService: OpenAIService;
  private reportService: ReportService;
  private configService: ConfigService;
  private logger: Logger;

  constructor(verbose: boolean = false) {
    this.configService = new ConfigService();
    this.logger = new Logger(verbose);

    const config = this.configService.getConfig();

    this.githubService = new GitHubService(config.githubToken);
    this.openaiService = new OpenAIService(config.openaiApiKey, config.openaiModel);
    this.reportService = new ReportService();

    this.configService.ensureOutputDirectory();
  }

  /**
   * Main analysis method
   */
  async analyzeComponent(options: AnalyzeOptions): Promise<ComponentAnalysisReport> {
    const { component, maxIssues = 50, includeClosedIssues = false, verbose = false } = options;

    this.logger.header(`Analyzing ${component} Component Issues`);

    try {
      // Step 1: Search for GitHub issues
      this.logger.progress(`Searching for issues related to "${component}"...`);
      const issues = await this.searchComponentIssues(component, maxIssues, includeClosedIssues);

      if (issues.length === 0) {
        this.logger.warning(`No issues found for component "${component}"`);
        return this.createEmptyReport(component);
      }

      this.logger.success(`Found ${issues.length} issues to analyze`);

      // Step 2: Analyze issues with OpenAI
      this.logger.progress('Analyzing issues with OpenAI...');
      const analyses = await this.analyzeIssuesWithOpenAI(component, issues);

      // Step 3: Generate summary
      this.logger.progress('Generating analysis summary...');
      const summary = await this.generateSummary(component, analyses);

      // Step 4: Create report
      const report = this.createReport(component, issues, analyses, summary);

      // Step 5: Display console summary
      this.logger.info(this.reportService.generateConsoleSummary(report));

      return report;
    } catch (error) {
      this.logger.error(`Analysis failed: ${error}`);
      throw error;
    }
  }

  /**
   * Search for component-related issues on GitHub
   */
  private async searchComponentIssues(
    component: string,
    maxIssues: number,
    includeClosedIssues: boolean
  ): Promise<GitHubIssue[]> {
    try {
      // Check rate limit first
      const rateLimit = await this.githubService.getRateLimit();
      if (rateLimit) {
        this.logger.debug(`GitHub API rate limit: ${rateLimit.remaining}/${rateLimit.limit}`);
        if (rateLimit.remaining < 10) {
          this.logger.warning('GitHub API rate limit is low. Consider using a GitHub token.');
        }
      }

      const issues = await this.githubService.searchComponentIssues(component, {
        maxIssues,
        includeClosedIssues,
      });

      this.logger.debug(`Retrieved ${issues.length} issues from GitHub`);
      return issues;
    } catch (error) {
      this.logger.error(`Failed to search GitHub issues: ${error}`);
      throw error;
    }
  }

  /**
   * Analyze issues using OpenAI
   */
  private async analyzeIssuesWithOpenAI(
    component: string,
    issues: GitHubIssue[]
  ): Promise<Array<{ github_issue: GitHubIssue; analysis: IssueAnalysis }>> {
    const requests: OpenAIIssueAnalysisRequest[] = issues.map((issue) => ({
      component_name: component,
      issue_title: issue.title,
      issue_body: issue.body || '',
      issue_labels: issue.labels.map((label) => label.name),
      issue_url: issue.html_url,
    }));

    this.logger.progress(`Analyzing ${requests.length} issues...`);
    const analyses = await this.openaiService.analyzeIssuesBatch(requests);

    // Combine GitHub issues with their analyses
    const results = issues.map((issue, index) => ({
      github_issue: issue,
      analysis: analyses[index],
    }));

    // Log analysis results
    const criticalCount = results.filter(
      (r) => r.analysis.is_critical || r.analysis.severity_level === 'critical'
    ).length;
    const highCount = results.filter((r) => r.analysis.severity_level === 'high').length;

    this.logger.success(`Analysis complete: ${criticalCount} critical, ${highCount} high priority`);

    if (criticalCount > 0) {
      this.logger.critical(`Found ${criticalCount} critical issues that may prevent basic component usage!`);
    }

    return results;
  }

  /**
   * Generate analysis summary using OpenAI
   */
  private async generateSummary(
    component: string,
    analyses: Array<{ github_issue: GitHubIssue; analysis: IssueAnalysis }>
  ): Promise<{
    most_critical_issues: string[];
    common_problems: string[];
    recommended_actions: string[];
  }> {
    try {
      return await this.openaiService.generateComponentSummary(component, analyses);
    } catch (error) {
      this.logger.warning(`Failed to generate summary: ${error}`);
      return {
        most_critical_issues: [],
        common_problems: ['Unable to generate summary due to API error'],
        recommended_actions: ['Manual review of issues recommended'],
      };
    }
  }

  /**
   * Create the final analysis report
   */
  private createReport(
    component: string,
    issues: GitHubIssue[],
    analyses: Array<{ github_issue: GitHubIssue; analysis: IssueAnalysis }>,
    summary: {
      most_critical_issues: string[];
      common_problems: string[];
      recommended_actions: string[];
    }
  ): ComponentAnalysisReport {
    const criticalIssues = analyses.filter(
      (a) => a.analysis.is_critical || a.analysis.severity_level === 'critical'
    ).length;
    const highPriorityIssues = analyses.filter(
      (a) => a.analysis.severity_level === 'high' && !a.analysis.is_critical
    ).length;

    return {
      component_name: component,
      analysis_date: new Date().toISOString(),
      total_issues: issues.length,
      critical_issues: criticalIssues,
      high_priority_issues: highPriorityIssues,
      issues: analyses,
      summary,
    };
  }

  /**
   * Create an empty report when no issues are found
   */
  private createEmptyReport(component: string): ComponentAnalysisReport {
    return {
      component_name: component,
      analysis_date: new Date().toISOString(),
      total_issues: 0,
      critical_issues: 0,
      high_priority_issues: 0,
      issues: [],
      summary: {
        most_critical_issues: [],
        common_problems: [],
        recommended_actions: [`No issues found for ${component} component - it appears to be stable!`],
      },
    };
  }

  /**
   * Save analysis report to files
   */
  async saveReport(report: ComponentAnalysisReport, outputFile?: string): Promise<void> {
    try {
      const markdownPath = outputFile || this.configService.getOutputPath(report.component_name, 'md');
      const jsonPath = this.configService.getOutputPath(report.component_name, 'json');

      await this.reportService.saveReport(report, markdownPath);
      await this.reportService.saveJsonReport(report, jsonPath);

      this.logger.success(`Reports saved:`);
      this.logger.info(`  Markdown: ${markdownPath}`);
      this.logger.info(`  JSON: ${jsonPath}`);
    } catch (error) {
      this.logger.error(`Failed to save report: ${error}`);
      throw error;
    }
  }

  /**
   * Get analysis statistics
   */
  getAnalysisStats(report: ComponentAnalysisReport): {
    criticalPercentage: number;
    highPriorityPercentage: number;
    avgConfidence: number;
  } {
    const total = report.total_issues;
    if (total === 0) {
      return { criticalPercentage: 0, highPriorityPercentage: 0, avgConfidence: 0 };
    }

    const criticalPercentage = (report.critical_issues / total) * 100;
    const highPriorityPercentage = (report.high_priority_issues / total) * 100;

    const avgConfidence = report.issues.reduce((sum, item) => sum + item.analysis.confidence_score, 0) / total;

    return {
      criticalPercentage: Math.round(criticalPercentage * 10) / 10,
      highPriorityPercentage: Math.round(highPriorityPercentage * 10) / 10,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
    };
  }
}
