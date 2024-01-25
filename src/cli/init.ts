import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Argv, Arguments } from 'yargs';

import os from 'node:os';
import { exec } from 'node:child_process';
import { access, mkdir, stat, readFile, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';

import log, { Logger } from '../utils/logger.js';
import { checkPackageJsonForNextVideo, updateTSConfigFileContent } from './lib/json-configs.js';
import updateNextConfigFile from './lib/next-config.js';

const GET_STARTED_CONTENTS = `{
  "status": "ready",
  "originalFilePath": "videos/get-started.mp4",
  "provider": "mux",
  "providerMetadata": {
    "mux": {
      "uploadId": "LJeQjU9A1n029JC8Nx2Z71U7wOsdVA02n9mPOL02iYspkY",
      "assetId": "3fMT5ZqYShCbiI00Um3K00eGAqf7d6xmylwDKVEYAl4Ck",
      "playbackId": "sxY31L6Opl02RWPpm3Gro9XTe7fRHBjs92x93kiB1vpc"
    }
  },
  "createdAt": 1701286882695,
  "updatedAt": 1701287023961,
  "size": 431539343,
  "sources": [{
    "src": "https://stream.mux.com/sxY31L6Opl02RWPpm3Gro9XTe7fRHBjs92x93kiB1vpc.m3u8",
    "type": "application/x-mpegURL"
  }],
  "poster": "https://image.mux.com/sxY31L6Opl02RWPpm3Gro9XTe7fRHBjs92x93kiB1vpc/thumbnail.webp",
  "blurDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAASCAYAAAA6yNxSAAAJcklEQVR4AQCBAH7/AAAAAP8FAAD/HxoZ/z86Of9dWVf/dHFu/4B9e/+Afnv/d3Zy/2lpZf9bXFf/UVNO/01RS/9QVE7/V1tV/19kXf9lamP/Z2xm/2VqZP9hZV//W19Z/1daVf9WWVP/WVpV/11eWf9iYV3/ZWNg/2VjYP9iYF3/XltY/1lWVP9XU1H/AIEAfv8ABQAA/xQNDP8uKCf/TklH/21oZv+EgH7/kI2K/5COi/+HhoP/eXl1/2tsaP9iZF//XmFc/2FkX/9obGb/cHRu/3Z6dP94fHb/dnp0/3F1b/9sb2n/aGtl/2dpZP9pamb/bm5q/3Nybv92dHH/dnRx/3Rxbv9wbGr/a2hm/2llY/8AgQB+/wAeFxb/LSYm/0hBQf9pY2L/iIOB/6Cbmv+tqaf/rquo/6WjoP+Xl5P/ioqG/4CBff99f3r/f4J9/4aJhP+OkYz/lJeS/5aZlP+Ul5L/j5KN/4qMh/+GiIP/hYaC/4iIhP+MjIj/kZCN/5WTkP+Wk5D/lJCO/5CMiv+MiIb/iYWD/wCBAH7/AD41Nv9ORUX/aWFh/4uDg/+rpKP/xL28/9HMyv/Tz83/y8jF/728uP+wr6v/pqai/6Okn/+mp6L/rK6p/7S2sf+5vLf/u765/7m8tv+0trH/r7Cs/6usqP+qq6f/ra2p/7Kxrf+3trL/u7m2/725t/+7t7X/uLOy/7Svrv+yrav/AIEAfv8AXlRV/25kZf+KgYH/rKSk/87Gxv/o4OD/9vDv//nz8v/x7ev/5eHf/9fV0v/OzMn/ysrG/8zNyP/T1M//2tvX/9/h3P/h497/3+Db/9rb1v/U1dD/0NHM/9DPy//T0c7/2NbT/97b2P/i393/5ODe/+Pf3f/g29r/3djW/9vV1P8AgQB+/wB4bW//iX1//6abnP/Jv8D/6+Lj///+/v//////////////////////+fbz/+/t6v/r6ub/7e3p//Pz7//6+/b////7/////f/9/vr/+Pn1//Lz7//v7ur/7u3q//Hw7P/39fL//fr4/////P/////////+///9+///+vj//fj2/wCBAH7/AIl8fv+ZjY//t6yt/9vR0v//9fb//////////////////////////////////////////f////7//////////////////////////////////////////f////z/////////////////////////////////////////////////AIEAfv8AjYGD/56SlP+9sbP/4tfZ///9/v////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AgQB+/wCIfH7/mY2P/7itr//f1NX///r7//////////////////////////////////////////////////////////////////////////////////////////z////7/////v///////////////////////////////////////////wCBAH7/AHtwcf+MgoP/rKKj/9PKyv/68fH////////////////////////////////////+//z8+P/7/fj//v/7///////////////////////7//n/9Pjy/+/z7f/u8uz/8vTv//j69f////z/////////////////////////////////AIEAfv8Aa2Ji/310dP+dlZX/xb29/+zl5P///////////////////////////////P/z9e//6+7p/+nu5//s8ev/8Pbv//P58v/y+fH/7vXt/+fu5//g5+D/3OLb/9vh2v/e493/5Onj/+zx6v/z9/H/+Pz2//v++P/7/vj/+vz3//n79v8AgQB+/wBdVlX/b2lo/4+Kif+4srH/39vZ///7+f//////////////////////8fXv/+Po4v/b4dr/2eDY/9vj2//e59//4eri/+Dq4f/c5t3/1d/W/87Yz//K08r/ydLJ/8zVzP/S29L/2uLa/+Lp4f/n7ub/6vDp/+rx6f/q8On/6e/o/wCBAH7/AFNQTf9mYmD/h4SB/6+tqv/X1dL/9vby//////////////////j99//n7eb/2ODY/8/Y0P/M183/ztnQ/9He0//U4db/0+DW/8/c0v/I1sv/ws/E/73KwP+8yb7/v8zB/8bSyP/O2tD/1uHX/9vm3f/e6eD/3+ng/9/o3//e6N//AIEAfv8AUFBM/2NjX/+EhID/ra2p/9TW0f/09/L/////////////////9P30/+Ls4//T3tX/ytbM/8bUyf/I1sv/y9vP/83e0v/N3tH/ydrN/8PUx/+8zcH/t8m8/7fHu/+6yr7/wdHF/8nZzf/R4NT/1+ba/9ro3f/b6d7/2+ne/9ro3f8AgQB+/wBTVVD/Zmhj/4eKhP+ws63/2NzW//f99v/////////////////2//j/5PDm/9Ti1//K2c7/xtfL/8jZzP/L3tD/zeHT/83h0//J3tD/w9jK/73Sw/+5zb//uMy+/7zQwv/D1sj/y97R/9Pm2P/Z697/3e/i/97w4//e7+L/3e/i/wCBAH7/AFleWP9scWr/jZOM/7a8tf/e5d7//v/+//////////////////v//v/o+Oz/2Ond/87g0//K3tD/y+DS/8/k1v/S6Nn/0ujZ/87l1v/J4ND/w9rK/77Wxv++1cb/wtnJ/8nf0P/R59j/2u/g/+D15v/k+Or/5frr/+X56//l+ev/AIEAfv8AYGZf/3N5cv+Um5T/vcW9/+Xu5f///////////////////////////+7/8//e8OP/0+fZ/8/l1v/R59j/1Ozc/9fv3//X8OD/1O3d/8/o1//J4tL/xd7O/8Xezf/J4dH/0OjY/9jw4P/h+On/5/7v/+v/8v/s//T/7f/0/+z/8/8BgQB+/wBka2T/d353/5igmP/BysH/6fPq////////////////////////////8v/3/+H15//X7N3/0+na/9Tr3P/Y8OD/2/Tj/9v15P/Y8uH/0+3c/83o1v/J5NL/yePS/83n1v/U7t3/3fbl/+X+7v/s//T/8P/4//H/+f/x//n/8f/5/45PjkBdIjvWAAAAAElFTkSuQmCC"
}
`;

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
  await writeFile(path.join(dir, 'get-started.mp4.json'), GET_STARTED_CONTENTS);

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

  log.space();
  log.info(`Why don't you try adding the component to a page?`);
  log.space();
  log.space(`${chalk.magenta('import')} Video ${chalk.magenta('from')} ${chalk.cyan("'next-video'")};
  ${chalk.magenta('import')} getStarted ${chalk.magenta('from')} ${chalk.cyan("'/videos/get-started.mp4'")};
  
  ${chalk.magenta('export default function')} Page() {
    ${chalk.magenta('return')} ${chalk.cyan('<')}Video ${chalk.cyan('src=')}{getStarted} ${chalk.cyan('/>')};
  }
  `);

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
