import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Argv, Arguments } from 'yargs';

import os from 'node:os';
import { exec } from 'node:child_process';
import { access, mkdir, stat, readFile, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';

import log, { Logger } from '../logger.js';
import { checkPackageJsonForNextVideo, updateTSConfigFileContent } from './lib/json-configs.js';
import updateNextConfigFile from './lib/next-config.js';

const TYPES_FILE_CONTENTS = `/// <reference types="next-video/video-types/global" />\n`;
const DEFAULT_DIR = 'videos';
const DEV_SCRIPT = '& npx next-video sync -w';

const gitIgnoreContents = (videosDir: string) => `
# next-video
${videosDir}/*
!${videosDir}/*.json
!${videosDir}/*.js
!${videosDir}/*.ts
public/_next-video
`;

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
  await appendFile('.gitignore', gitIgnoreContents(dir));
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
    devscript: {
      describe: `Automatically update your package.json to add the watch command to your dev script.`,
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
  let updateDevScript = argv.devscript;
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
  }

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

  // If we're on Windows don't try to update the dev script.
  // Command shell and PowerShell requires more complex additions for parallel scripts.
  const cmd = await isCmd();

  if (!cmd && !updateDevScript) {
    updateDevScript = await confirm({
      message: `Update package.json to add the watch command to your dev script?`,
      default: true,
    });
  }

  if (!cmd && updateDevScript) {
    try {
      const devScript = (await execPromise(`npm pkg get scripts.dev`) as string)?.trim().slice(1, -1);

      if (devScript && !devScript.includes(DEV_SCRIPT)) {
        // Use npm pkg set instead of writeFile to maintain indentation.
        await execPromise(`npm pkg set scripts.dev='${devScript} ${DEV_SCRIPT}'`);
      }

      changes.push([log.add, `Updated package.json to add the watch command to your dev script.`]);
    } catch (err: any) {
      changes.push([log.error, `Failed to update package.json, please add "${DEV_SCRIPT}" to your dev script.`]);
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

  log.info('');
  log.info(`NEXT STEP: Set up remote storage`);
  log.info(chalk.magenta.bold('https://next-video.dev/docs#remote-storage-and-optimization'));
  log.info('');
}

async function isCmd() {
  if (os.platform() === 'win32') {
    try {
      await execPromise(`ls`);
    } catch (err) {
      return true
    }
  }
  return false;
}
