import chalk from 'chalk';

export class Logger {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ️ '), message);
  }

  success(message: string): void {
    console.log(chalk.green('✅'), message);
  }

  warning(message: string): void {
    console.log(chalk.yellow('⚠️ '), message);
  }

  error(message: string): void {
    console.log(chalk.red('❌'), message);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray('🔍'), message);
    }
  }

  progress(message: string): void {
    console.log(chalk.cyan('⏳'), message);
  }

  critical(message: string): void {
    console.log(chalk.red.bold('🚨'), message);
  }

  header(message: string): void {
    console.log('\n' + chalk.bold.underline(message) + '\n');
  }

  separator(): void {
    console.log(chalk.gray('─'.repeat(50)));
  }
}
