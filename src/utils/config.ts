import * as dotenv from 'dotenv';
import * as path from 'path';
import { Config } from '../types';

// Load environment variables
dotenv.config();

export class ConfigService {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  getConfig(): Config {
    return this.config;
  }

  private loadConfig(): Config {
    return {
      githubToken: process.env.GITHUB_TOKEN,
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      outputDir: process.env.OUTPUT_DIR || './reports',
    };
  }

  private validateConfig(): void {
    if (!this.config.openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    if (!this.config.githubToken) {
      console.warn('⚠️  GITHUB_TOKEN not provided. API rate limits will be lower.');
    }
  }

  /**
   * Get output file path for a component report
   */
  getOutputPath(componentName: string, format: 'md' | 'json' = 'md'): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${componentName}-analysis-${timestamp}.${format}`;
    return path.join(this.config.outputDir, filename);
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDirectory(): void {
    const fs = require('fs');
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }
}
