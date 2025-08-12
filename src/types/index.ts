export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  comments: number;
}

export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
}

export interface IssueAnalysis {
  issue_id: number;
  is_critical: boolean;
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  affected_functionality: string[];
  impact_description: string;
  confidence_score: number; // 0-100
}

export interface ComponentAnalysisReport {
  component_name: string;
  analysis_date: string;
  total_issues: number;
  critical_issues: number;
  high_priority_issues: number;
  issues: Array<{
    github_issue: GitHubIssue;
    analysis: IssueAnalysis;
  }>;
  summary: {
    most_critical_issues: string[];
    common_problems: string[];
    recommended_actions: string[];
  };
}

export interface OpenAIIssueAnalysisRequest {
  component_name: string;
  issue_title: string;
  issue_body: string;
  issue_labels: string[];
  issue_url: string;
}

export interface Config {
  githubToken?: string;
  openaiApiKey: string;
  openaiModel?: string;
  outputDir: string;
}

export interface AnalyzeOptions {
  component: string;
  maxIssues?: number;
  includeClosedIssues?: boolean;
  outputFile?: string;
  verbose?: boolean;
}
