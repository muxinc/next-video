import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Argv, Arguments } from 'yargs';

import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import * as log from '../logger.js';

const GITIGNORE_CONTENTS = `*
!*.json
!*.js
!*.ts`;

const TYPES_FILE_CONTENTS = `/// <reference types="@mux/next-video/video-types/global" />\n`;

const DEFAULT_DIR = 'videos';

async function preInitCheck(dir: string) {
  try {
    await stat(dir);
    return false;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      // Directory doesn't exist, so we can proceed.
      return true;
    }
    throw err;
  }
}

async function createVideoDir(dir: string) {
  const fullPath = path.join(process.cwd(), dir);

  await mkdir(fullPath, { recursive: true });
  await writeFile(path.join(dir, '.gitignore'), GITIGNORE_CONTENTS);
  return;
}

async function createTSFile() {
  await writeFile(path.join(process.cwd(), 'video.d.ts'), TYPES_FILE_CONTENTS);
  return;
}

export const command = 'init [dir]';
export const desc = 'Initializes next-video in a project.';
export function builder(yargs: Argv) {
  return yargs.options({
    dir: {
      alias: 'd',
      describe: 'The directory you want to initialize next-video with.',
      type: 'string',
    },
    force: {
      alias: 'f',
      describe: 'Continue with initialization even if the chosen directory already exists.',
      type: 'boolean',
      default: false,
    },
    typescript: {
      alias: 'ts',
      describe: 'Initialize next-video for use with TypeScript.',
      type: 'boolean',
      default: false,
    },
  }); // We also need to add the typescript check and add the `next-video.d.ts` file.
}
export async function handler(argv: Arguments) {
  let baseDir = argv.dir as string;
  let ts = argv.typescript as boolean;
  let changes: string[] = [];

  if (!baseDir) {
    baseDir = await input({ message: 'What directory should next-video use for video files?', default: DEFAULT_DIR });
  }

  const shouldContinue = await preInitCheck(baseDir);
  if (!argv.force && !shouldContinue) {
    log.warning('Directory already exists:', baseDir);
    log.info("If you'd like to proceed anyway, re-run with --force");
    return;
  }

  // The TypeScript flag is there to short circuit this prompt, but if it's false
  // we should ask just in case.
  if (!ts) {
    ts = await confirm({ message: 'Is this a TypeScript project?', default: true });
  }

  await createVideoDir(baseDir);

  changes.push(`Created ${baseDir} directory.`);

  if (ts) {
    await createTSFile();
    changes.push(`Created video.d.ts. Add this to your tsconfig.json's include array.`);
  }

  log.success(`${chalk.magenta.bold('next-video')} initialized!`);
  changes.forEach((change) => log.add(change));
}
