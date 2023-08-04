type LogType = 'info' | 'warn' | 'error';
export default function log(type: LogType, ...messages: any[]) {
  console[type]('- \x1b[35m%s\x1b[0m', '[next-video]:', ...messages);
}
