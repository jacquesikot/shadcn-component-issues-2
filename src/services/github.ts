import { Octokit } from '@octokit/rest';
import { GitHubIssue, GitHubSearchResponse } from '../types';

export class GitHubService {
  private octokit: Octokit;
  private readonly REPO_OWNER = 'shadcn-ui';
  private readonly REPO_NAME = 'ui';

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Search for issues related to a specific component
   */
  async searchComponentIssues(
    componentName: string,
    options: {
      maxIssues?: number;
      includeClosedIssues?: boolean;
      state?: 'open' | 'closed' | 'all';
    } = {}
  ): Promise<GitHubIssue[]> {
    const { maxIssues = 100, includeClosedIssues = false } = options;
    const state = options.state || (includeClosedIssues ? 'all' : 'open');

    try {
      // Create search queries for the component
      // const searchQueries = this.buildSearchQueries(componentName, state);
      const searchQueries = [`repo:shadcn-ui/ui is:issue state:open ${componentName}`];
      const allIssues: GitHubIssue[] = [];
      const seenIssues = new Set<number>();

      for (const query of searchQueries) {
        console.log(`Searching with query: ${query}`);

        const response = await this.octokit.rest.search.issuesAndPullRequests({
          q: query,
          sort: 'updated',
          order: 'desc',
          per_page: Math.min(maxIssues, 100),
        });

        // Filter out pull requests and duplicates
        const issues = response.data.items
          .filter((item) => !item.pull_request && !seenIssues.has(item.number))
          .map((item) => {
            seenIssues.add(item.number);
            return this.transformIssue(item);
          });

        allIssues.push(...issues);

        if (allIssues.length >= maxIssues) {
          break;
        }
      }

      return allIssues.slice(0, maxIssues);
    } catch (error) {
      console.error('Error searching GitHub issues:', error);
      throw new Error(`Failed to search GitHub issues: ${error}`);
    }
  }

  /**
   * Get detailed information for a specific issue
   */
  async getIssueDetails(issueNumber: number): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.rest.issues.get({
        owner: this.REPO_OWNER,
        repo: this.REPO_NAME,
        issue_number: issueNumber,
      });

      return this.transformIssue(response.data);
    } catch (error) {
      console.error(`Error fetching issue #${issueNumber}:`, error);
      throw new Error(`Failed to fetch issue #${issueNumber}: ${error}`);
    }
  }

  /**
   * Build search queries for finding component-related issues
   */
  private buildSearchQueries(componentName: string, state: string): string[] {
    const baseQuery = `repo:${this.REPO_OWNER}/${this.REPO_NAME} is:issue state:${state}`;

    const queries = [
      // Direct component name mentions
      `${baseQuery} "${componentName}" in:title`,
      `${baseQuery} "${componentName}" in:body`,

      // Component variations (kebab-case, camelCase, etc.)
      `${baseQuery} "${this.toKebabCase(componentName)}" in:title`,
      `${baseQuery} "${this.toKebabCase(componentName)}" in:body`,

      // Component with common prefixes/suffixes
      `${baseQuery} "${componentName} component"`,
      `${baseQuery} "${componentName}Component"`,

      // Bug-specific searches
      `${baseQuery} "${componentName}" label:bug`,
      `${baseQuery} "${componentName}" "not working"`,
      `${baseQuery} "${componentName}" "broken"`,
      `${baseQuery} "${componentName}" "issue"`,

      // Performance-related searches
      `${baseQuery} "${componentName}" "slow"`,
      `${baseQuery} "${componentName}" "performance"`,

      // Accessibility searches
      `${baseQuery} "${componentName}" "accessibility"`,
      `${baseQuery} "${componentName}" "a11y"`,
    ];

    return queries;
  }

  /**
   * Transform GitHub API response to our internal format
   */
  private transformIssue(item: any): GitHubIssue {
    return {
      id: item.id,
      number: item.number,
      title: item.title,
      body: item.body,
      state: item.state,
      created_at: item.created_at,
      updated_at: item.updated_at,
      html_url: item.html_url,
      user: {
        login: item.user.login,
        avatar_url: item.user.avatar_url,
      },
      labels: item.labels.map((label: any) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        description: label.description,
      })),
      assignees: item.assignees.map((assignee: any) => ({
        login: assignee.login,
        avatar_url: assignee.avatar_url,
      })),
      comments: item.comments,
    };
  }

  /**
   * Convert string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Get rate limit information
   */
  async getRateLimit() {
    try {
      const response = await this.octokit.rest.rateLimit.get();
      return response.data.rate;
    } catch (error) {
      console.error('Error getting rate limit:', error);
      return null;
    }
  }
}
