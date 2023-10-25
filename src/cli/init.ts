import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Argv, Arguments } from 'yargs';

import { exec } from 'node:child_process';
import { access, mkdir, stat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import log, { Logger } from '../logger.js';
import { checkPackageJsonForNextVideo, updateTSConfigFileContent } from './lib/json-configs.js';
import updateNextConfigFile from './lib/next-config.js';

const GITIGNORE_CONTENTS = `*
!*.json
!*.js
!*.ts`;

const GET_STARTED_CONTENTS = `{
  "status": "ready",
  "originalFilePath": "videos/get-started.mp4",
  "externalIds": {
    "uploadId": "gh4iwXCjWtFJ9ttRPerr5VrnHv00mE00or1nL6vNiLb2w",
    "assetId": "KosQ6BK5t0169tsioA00dJx7uq9b3RQADGUt8kEiXO9BU",
    "playbackId": "FTLlwEPNjT2FztXbLwwWHKzE1IFRGE301soZqhv7H2EM"
  },
  "createdAt": 1697642264605,
  "updatedAt": 1697642295355,
  "blurDataURL": "data:image/png;base64,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"
}
`;

const TYPES_FILE_CONTENTS = `/// <reference types="next-video/video-types/global" />\n`;

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

async function checkVersionManager() {
  try {
    await access('package-lock.json');
    return 'npm';
  } catch {
    // not NPM
  }

  try {
    await access('yarn.lock');
    return 'yarn';
  } catch {
    // not Yarn
  }

  try {
    await access('pnpm-lock.yaml');
    return 'pnpm';
  } catch {
    // not PNPM
  }

  return undefined;
}

function execPromise(command: string) {
  return new Promise((resolve, reject) => {
    exec(command, (err: any, stdout: any, stderr: any) => {
      if (err) {
        return reject(err);
      }

      return resolve(stdout);
    });
  });
}

async function createVideoDir(dir: string) {
  const fullPath = path.join(process.cwd(), dir);

  await mkdir(fullPath, { recursive: true });
  await writeFile(path.join(dir, '.gitignore'), GITIGNORE_CONTENTS);
  await writeFile(path.join(dir, 'getStarted.mp4.json'), GET_STARTED_CONTENTS);
  return;
}

async function createTSFile(filePath: string) {
  await writeFile(filePath, TYPES_FILE_CONTENTS);
  return;
}

async function updateTSConfigFile(tsConfigPath: string) {
  const configContents = await readFile(tsConfigPath, 'utf-8');

  const updatedContents = updateTSConfigFileContent(configContents);

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
  let packageInstalled: boolean = false;
  let ts = argv.typescript;
  let updateTsConfig = argv.tsconfig;
  let changes: [Logger, string][] = [];

  try {
    packageInstalled = await checkPackageJsonForNextVideo('./package.json');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      log.error(
        `Failed to find/read a local package.json. Double check that you're running this from the root of your project.`
      );
      return;
    }

    console.log(err);
  }

  if (!packageInstalled) {
    const install = await confirm({
      message: `It doesn't look like ${chalk.magenta.bold(
        'next-video'
      )} is installed in this project. Would you like to install it now?`,
      default: true,
    });

    if (install) {
      const manager = await checkVersionManager();

      if (!manager) {
        log.error('Failed to detect a package manager. Please install next-video manually and re-run this command.');
        log.info('For example, in NPM: npm install --save-dev next-video');
        return;
      }

      log.info('Detected package manager:', manager);
      log.info('Installing next-video...');

      try {
        if (manager === 'npm') {
          await execPromise('npm install next-video');
        } else if (manager === 'yarn') {
          await execPromise('yarn add next-video');
        } else if (manager === 'pnpm') {
          await execPromise('pnpm add next-video');
        }
        log.info('Successfully installed next-video!');
      } catch (err: any) {
        log.error('Failed to install next-video:', err);
      }
    } else {
      log.info('Make sure to add next-video to your package.json manually');
    }
  }

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

  try {
    const update = await updateNextConfigFile('./', { folder: baseDir });

    if (update) {
      changes.push([log.add, `Updated ${update.configPath} to include next-video.`]);
    }
  } catch (e: any) {
    if (e.error === 'not_found') {
      changes.push([
        log.error,
        'No next.config.js or next.config.mjs file found. Please add next-video to your config manually.',
      ]);
    } else if (e.error === 'already_added') {
      changes.push([log.info, 'It seems like next-video is already added to your Next Config']);
    } else {
      changes.push([log.error, 'Failed to update next.config.js, please add next-video to your config manually.']);
    }
  }

  log.success(`${chalk.magenta.bold('next-video')} initialized!`);

  changes.forEach(([loggerFn, change]) => loggerFn(change));

  log.space();
  log.info(`Why don't you try adding the component to a page?`);
  log.space();
  log.space(`${chalk.magenta('import')} Video ${chalk.magenta('from')} ${chalk.cyan("'next-video'")};
  ${chalk.magenta('import')} getStarted ${chalk.magenta('from')} ${chalk.cyan("'/videos/getStarted.mp4'")};
  
  ${chalk.magenta('export default function')} Page() {
    ${chalk.magenta('return')} ${chalk.cyan('<')}Video ${chalk.cyan('src=')}{getStarted} ${chalk.cyan('/>')};
  }
  `);
}
