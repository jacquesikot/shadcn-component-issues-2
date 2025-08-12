#!/usr/bin/env node

import { Command } from 'commander';
import { ShadcnIssueAnalyzer } from './analyzer';
import { Logger } from './utils/logger';
import * as packageJson from '../package.json';

const program = new Command();
const logger = new Logger();

program
  .name('shadcn-analyzer')
  .description('Analyze shadcn/ui component issues and identify critical ones')
  .version(packageJson.version);

program
  .command('analyze')
  .description('Analyze issues for a specific shadcn component')
  .argument('<component>', 'Name of the component to analyze (e.g., "button", "dialog", "select")')
  .option('-m, --max-issues <number>', 'Maximum number of issues to analyze', '50')
  .option('-c, --include-closed', 'Include closed issues in analysis', false)
  .option('-o, --output <file>', 'Output file path for the markdown report')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (component: string, options) => {
    try {
      logger.header(`🔍 Shadcn Component Issue Analyzer v${packageJson.version}`);

      const analyzer = new ShadcnIssueAnalyzer(options.verbose);

      const analyzeOptions = {
        component: component.toLowerCase(),
        maxIssues: parseInt(options.maxIssues),
        includeClosedIssues: options.includeClosed,
        outputFile: options.output,
        verbose: options.verbose,
      };

      // Validate component name
      if (!component || component.trim().length === 0) {
        logger.error('Component name is required');
        process.exit(1);
      }

      logger.info(`Starting analysis for "${component}" component...`);
      logger.separator();

      // Run the analysis
      const report = await analyzer.analyzeComponent(analyzeOptions);

      // Save the report
      await analyzer.saveReport(report, options.output);

      // Display final statistics
      const stats = analyzer.getAnalysisStats(report);
      logger.separator();
      logger.header('📊 Final Statistics');
      logger.info(`Critical Issues: ${report.critical_issues}/${report.total_issues} (${stats.criticalPercentage}%)`);
      logger.info(
        `High Priority Issues: ${report.high_priority_issues}/${report.total_issues} (${stats.highPriorityPercentage}%)`
      );
      logger.info(`Average Confidence: ${stats.avgConfidence}%`);

      if (report.critical_issues > 0) {
        logger.critical(`⚠️  ${report.critical_issues} critical issues found! Review the report for details.`);
      } else {
        logger.success(`✅ No critical issues found for ${component} component!`);
      }
    } catch (error) {
      logger.error(`Analysis failed: ${error}`);
      process.exit(1);
    }
  });

program
  .command('list-components')
  .description('List common shadcn/ui components')
  .action(() => {
    logger.header('📋 Common shadcn/ui Components');

    const components = [
      'button',
      'input',
      'label',
      'textarea',
      'select',
      'dialog',
      'alert-dialog',
      'sheet',
      'popover',
      'tooltip',
      'dropdown-menu',
      'context-menu',
      'navigation-menu',
      'menubar',
      'table',
      'card',
      'avatar',
      'badge',
      'separator',
      'tabs',
      'accordion',
      'collapsible',
      'scroll-area',
      'slider',
      'switch',
      'checkbox',
      'radio-group',
      'form',
      'calendar',
      'date-picker',
      'command',
      'toast',
      'alert',
      'progress',
      'skeleton',
      'aspect-ratio',
      'resizable',
      'toggle',
      'toggle-group',
      'hover-card',
      'breadcrumb',
      'pagination',
      'carousel',
      'drawer',
      'sidebar',
      'sonner',
      'chart',
    ];

    components.forEach((component, index) => {
      if (index % 4 === 0) console.log('');
      process.stdout.write(component.padEnd(20));
    });
    console.log('\n');

    logger.info('Use: shadcn-analyzer analyze <component-name>');
  });

program
  .command('setup')
  .description('Setup environment variables')
  .action(() => {
    logger.header('🔧 Environment Setup');
    logger.info('Create a .env file in your project root with:');
    console.log('');
    console.log('# Required');
    console.log('OPENAI_API_KEY=your_openai_api_key_here');
    console.log('');
    console.log('# Optional (for higher GitHub API rate limits)');
    console.log('GITHUB_TOKEN=your_github_personal_access_token');
    console.log('');
    console.log('# Optional (defaults to gpt-4-turbo-preview)');
    console.log('OPENAI_MODEL=gpt-4-turbo-preview');
    console.log('');
    logger.info('GitHub token can be created at: https://github.com/settings/tokens');
    logger.info('OpenAI API key can be found at: https://platform.openai.com/api-keys');
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
