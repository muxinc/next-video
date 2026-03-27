import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import chalk from 'chalk';
import log from '../logger.js';

const execAsync = promisify(exec);

export async function openUrl(url: string, pageName?: string): Promise<void> {
  const platform = os.platform();

  try {
    let command: string;

    switch (platform) {
      case 'darwin':
        command = `open "${url}"`;
        break;
      case 'win32':
        command = `start "" "${url}"`;
        break;
      default:
        command = `xdg-open "${url}"`;
        break;
    }
    log.info(`Opening ${pageName ? `${chalk.blue.bold(pageName)} page` : 'URL'} in your browser...`);
    await execAsync(command);
    log.success(`${pageName ? `${chalk.blue.bold(pageName)} page` : 'URL'} opened in your browser!`);
    log.space();
  } catch (error) {
    log.error(`Failed to open URL automatically: ${url}`);
    log.warning('Please open the URL manually in your browser.');
  }
}
