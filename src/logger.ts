import chalk from 'chalk';

export function info(...messages: any[]) {
  console.log(chalk.blue.bold('-'), ...messages);
}

export function success(...messages: any[]) {
  console.log(chalk.green.bold('✓'), ...messages);
}

export function add(...messages: any[]) {
  console.log(chalk.blue.green('+'), ...messages);
}

export function warning(...messages: any[]) {
  console.log(chalk.yellow.bold('!'), ...messages);
}

export function error(...messages: any[]) {
  console.error(chalk.red.bold('✗'), ...messages);
  console.log('');
}

export function space(...messages: any[]) {
  console.log(' ', ...messages);
}

export function label(detail: string) {
  return chalk.magenta.bold(detail);
}
