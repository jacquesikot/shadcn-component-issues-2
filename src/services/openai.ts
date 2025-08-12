import OpenAI from 'openai';
import { IssueAnalysis, OpenAIIssueAnalysisRequest } from '../types';

export class OpenAIService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.client = new OpenAI({
      apiKey,
    });
    this.model = model;
  }

  /**
   * Analyze a GitHub issue to determine if it's critical for component usage
   */
  async analyzeIssue(request: OpenAIIssueAnalysisRequest): Promise<IssueAnalysis> {
    const prompt = this.buildAnalysisPrompt(request);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert frontend developer and component library maintainer. Your task is to analyze GitHub issues related to the ${request.component_name} shadcn/ui only and determine their criticality for basic component usage and performance.

A CRITICAL issue is one that:
- Prevents the component from rendering or functioning at all
- Causes the component to crash the application
- Makes the component completely unusable for its primary purpose
- Causes severe performance issues that make the component unusable
- Introduces security vulnerabilities
- Breaks core accessibility features that make the component unusable for users with disabilities

A HIGH priority issue is one that:
- Significantly impacts the component's functionality but doesn't prevent basic usage
- Causes noticeable performance degradation
- Affects important but not core features
- Has workarounds but they are complex or hacky

A MEDIUM priority issue is one that:
- Affects edge cases or less common use cases
- Has minor performance impacts
- Affects styling or visual appearance in non-breaking ways
- Has simple workarounds

A LOW priority issue is one that:
- Affects very specific edge cases
- Is more of an enhancement than a bug
- Has minimal impact on functionality
- Is primarily cosmetic

Respond with a JSON object matching the IssueAnalysis interface.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_object',
        },
        temperature: 0.1,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      const analysis = JSON.parse(content) as IssueAnalysis;

      // Validate the response structure
      this.validateAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing issue with OpenAI:', error);

      // Return a fallback analysis if OpenAI fails
      return {
        issue_id: parseInt(request.issue_url.split('/').pop() || '0'),
        is_critical: false,
        severity_level: 'medium',
        reasoning: `Failed to analyze with OpenAI: ${error}. Manual review required.`,
        affected_functionality: ['unknown'],
        impact_description: 'Unable to determine impact due to analysis failure',
        confidence_score: 0,
      };
    }
  }

  /**
   * Analyze multiple issues in batch
   */
  async analyzeIssuesBatch(requests: OpenAIIssueAnalysisRequest[]): Promise<IssueAnalysis[]> {
    const results: IssueAnalysis[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      console.log(`Analyzing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(requests.length / batchSize)}...`);

      const batchPromises = batch.map((request) => this.analyzeIssue(request));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to analyze issue ${batch[index].issue_url}:`, result.reason);
          // Add fallback analysis for failed requests
          results.push({
            issue_id: parseInt(batch[index].issue_url.split('/').pop() || '0'),
            is_critical: false,
            severity_level: 'medium',
            reasoning: `Analysis failed: ${result.reason}`,
            affected_functionality: ['unknown'],
            impact_description: 'Unable to determine impact due to analysis failure',
            confidence_score: 0,
          });
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Generate a summary analysis of all issues for a component
   */
  async generateComponentSummary(
    componentName: string,
    analyses: Array<{ analysis: IssueAnalysis; github_issue: any }>
  ): Promise<{
    most_critical_issues: string[];
    common_problems: string[];
    recommended_actions: string[];
  }> {
    const criticalAnalyses = analyses.filter((a) => a.analysis.is_critical || a.analysis.severity_level === 'critical');
    const highPriorityAnalyses = analyses.filter((a) => a.analysis.severity_level === 'high');

    const prompt = `
Analyze the following component issue analyses for the ${componentName} component and provide a summary:

Critical Issues (${criticalAnalyses.length}):
${criticalAnalyses.map((a) => `- ${a.github_issue.title}: ${a.analysis.reasoning}`).join('\n')}

High Priority Issues (${highPriorityAnalyses.length}):
${highPriorityAnalyses.map((a) => `- ${a.github_issue.title}: ${a.analysis.reasoning}`).join('\n')}

Please provide:
1. most_critical_issues: Array of the top 3-5 most critical issue titles/descriptions
2. common_problems: Array of common problem patterns you notice
3. recommended_actions: Array of recommended actions for developers using this component

Respond with a JSON object.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert frontend developer providing actionable insights about component issues. Be concise and practical.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_object',
        },
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating component summary:', error);
      return {
        most_critical_issues: criticalAnalyses.slice(0, 3).map((a) => a.github_issue.title),
        common_problems: ['Unable to analyze common problems due to API error'],
        recommended_actions: ['Manual review of issues recommended due to analysis failure'],
      };
    }
  }

  /**
   * Build the analysis prompt for a single issue
   */
  private buildAnalysisPrompt(request: OpenAIIssueAnalysisRequest): string {
    return `
Analyze this GitHub issue for the ${request.component_name} component:

**Issue Title:** ${request.issue_title}

**Issue URL:** ${request.issue_url}

**Labels:** ${request.issue_labels.join(', ') || 'None'}

**Issue Description:**
${request.issue_body || 'No description provided'}

Please analyze this issue and respond with a JSON object containing:
{
  "issue_id": number, // Extract from URL
  "is_critical": boolean, // true if this prevents basic component usage
  "severity_level": "low" | "medium" | "high" | "critical",
  "reasoning": "string", // Detailed explanation of your assessment
  "affected_functionality": ["array", "of", "affected", "features"],
  "impact_description": "string", // How this affects users
  "confidence_score": number // 0-100, how confident you are in this assessment
}

Focus on whether this issue prevents the component from working for its intended purpose or causes significant usability problems.`;
  }

  /**
   * Validate the analysis response structure
   */
  private validateAnalysis(analysis: any): void {
    const required = [
      'issue_id',
      'is_critical',
      'severity_level',
      'reasoning',
      'affected_functionality',
      'impact_description',
      'confidence_score',
    ];
    const missing = required.filter((field) => !(field in analysis));

    if (missing.length > 0) {
      throw new Error(`Missing required fields in analysis: ${missing.join(', ')}`);
    }

    if (!['low', 'medium', 'high', 'critical'].includes(analysis.severity_level)) {
      throw new Error(`Invalid severity_level: ${analysis.severity_level}`);
    }

    if (
      typeof analysis.confidence_score !== 'number' ||
      analysis.confidence_score < 0 ||
      analysis.confidence_score > 100
    ) {
      throw new Error(`Invalid confidence_score: ${analysis.confidence_score}`);
    }
  }
}
