import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Argv, Arguments } from 'yargs';

import { mkdir, stat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import log, { Logger } from '../logger.js';
import { updateTSConfigFileContent } from './lib/json-configs.js';

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

async function createTSFile(filePath: string) {
  await writeFile(filePath, TYPES_FILE_CONTENTS);
  return;
}

async function updateTSConfigFile(tsConfigPath: string) {
  const configContents = await readFile(tsConfigPath, 'utf-8');

  const updatedContents = await updateTSConfigFileContent(configContents);

  return writeFile(tsConfigPath, updatedContents);
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
    tsconfig: {
      describe: 'Automatically update your tsconfig.json file to include the next-video types.',
      type: 'boolean',
      default: false,
    },
  }); // We also need to add the typescript check and add the `next-video.d.ts` file.
}
export async function handler(argv: Arguments) {
  let baseDir = argv.dir as string;
  let ts = argv.typescript;
  let updateTsConfig = argv.tsconfig;
  let changes: [Logger, string][] = [];

  if (!baseDir) {
    baseDir = await input({ message: 'What directory should next-video use for video files?', default: DEFAULT_DIR });
  }

  const shouldContinue = await preInitCheck(baseDir);
  if (!argv.force && !shouldContinue) {
    log.warning('Directory already exists:', baseDir);
    log.info("If you'd like to proceed anyway, re-run with --force");
    return;
  }

  await createVideoDir(baseDir);
  changes.push([log.add, `Created ${baseDir} directory.`]);

  // The TypeScript flag is there to short circuit this prompt, but if it's false
  // we should ask just in case.
  if (!ts) {
    ts = await confirm({ message: 'Is this a TypeScript project?', default: true });

    if (ts) {
      await createTSFile(path.join(process.cwd(), 'video.d.ts'));
      changes.push([log.add, `Created video.d.ts.`]);
    }

    if (ts && !updateTsConfig) {
      updateTsConfig = await confirm({ message: 'Update tsconfig.json to include next-video types?', default: true });
    }

    if (updateTsConfig) {
      try {
        await updateTSConfigFile(path.join(process.cwd(), 'tsconfig.json'));
        changes.push([log.add, `Updated tsconfig.json to include next-video types.`]);
      } catch (err: any) {
        changes.push([log.error, 'Failed to update tsconfig.json, please add "video.d.ts" to the include array']);
      }
    } else if (ts) {
      // If they didn't update the config but ts is still true then we should
      // let them know they need to update their tsconfig.
      changes.push([log.info, `Add ${chalk.underline('video.d.ts')} to the includes array in tsconfig.json.`]);
    }
  }

  log.success(`${chalk.magenta.bold('next-video')} initialized!`);
  changes.forEach(([loggerFn, change]) => loggerFn(change));
}
