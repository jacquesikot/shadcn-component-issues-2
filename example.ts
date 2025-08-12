/**
 * Example usage of the Shadcn Issue Analyzer
 *
 * This file demonstrates how to use the analyzer programmatically
 */

import { ShadcnIssueAnalyzer } from './src/analyzer';
import { Logger } from './src/utils/logger';

async function runExample() {
  const logger = new Logger(true); // verbose mode

  try {
    logger.header('🚀 Shadcn Issue Analyzer Example');

    // Initialize the analyzer
    const analyzer = new ShadcnIssueAnalyzer(true);

    // Analyze a component (using "button" as it's likely to have issues)
    logger.info('Analyzing "button" component...');

    const report = await analyzer.analyzeComponent({
      component: 'button',
      maxIssues: 10, // Small number for demo
      includeClosedIssues: false,
      verbose: true,
    });

    // Display results
    logger.success('Analysis completed!');
    logger.info(`Total issues found: ${report.total_issues}`);
    logger.info(`Critical issues: ${report.critical_issues}`);
    logger.info(`High priority issues: ${report.high_priority_issues}`);

    // Get detailed statistics
    const stats = analyzer.getAnalysisStats(report);
    logger.info(`Critical percentage: ${stats.criticalPercentage}%`);
    logger.info(`Average confidence: ${stats.avgConfidence}%`);

    // Save the report
    await analyzer.saveReport(report, './example-report.md');
    logger.success('Report saved to ./example-report.md');

    // Display some critical issues if found
    if (report.critical_issues > 0) {
      logger.critical('Critical issues found:');
      const criticalIssues = report.issues.filter(
        (item) => item.analysis.is_critical || item.analysis.severity_level === 'critical'
      );

      criticalIssues.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.github_issue.title}`);
        console.log(`   Reason: ${item.analysis.reasoning.substring(0, 100)}...`);
        console.log(`   Confidence: ${item.analysis.confidence_score}%`);
        console.log('');
      });
    } else {
      logger.success('No critical issues found! 🎉');
    }
  } catch (error) {
    logger.error(`Example failed: ${error}`);

    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      logger.info('💡 Make sure to set up your .env file with OPENAI_API_KEY');
      logger.info('   See README.md for setup instructions');
    }
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample().catch(console.error);
}

export { runExample };
