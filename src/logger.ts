import chalk from 'chalk';

type logType = 'log' | 'error';

export function base(type: logType, ...messages: string[]) {
  console[type](...messages);
}

export function info(...messages: any[]) {
  base('log', chalk.blue.bold('-'), ...messages);
}

export function success(...messages: any[]) {
  base('log', chalk.green.bold('✓'), ...messages);
}

export function add(...messages: any[]) {
  base('log', chalk.blue.green('+'), ...messages);
}

export function warning(...messages: any[]) {
  base('log', chalk.yellow.bold('!'), ...messages);
}

export function error(...messages: any[]) {
  base('error', chalk.red.bold('✗'), ...messages);
  base('log', '');
}

export function space(...messages: any[]) {
  base('log', ' ', ...messages);
}

export function label(detail: string) {
  return chalk.magenta.bold(detail);
}

export default {
  base,

  info,
  success,
  add,
  warning,
  error,
  space,
  label,
};
