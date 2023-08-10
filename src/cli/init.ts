import { confirm, input } from '@inquirer/prompts';
import { Argv, Arguments } from 'yargs';

import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const GITIGNORE_CONTENTS = `files/*
!files/*.json`;

const TYPES_FILE_CONTENTS = `/// <reference types="next-video/video-types/global" />\n`;

const DEFAULT_DIR = 'video';

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
  const fullPath = path.join(process.cwd(), dir, 'files');

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

  if (!baseDir) {
    baseDir = await input({ message: 'What directory should next-video use for video files?', default: DEFAULT_DIR });
  }

  const shouldContinue = await preInitCheck(baseDir);
  if (!argv.force && !shouldContinue) {
    console.log('Directory already exists:', baseDir);
    console.log("If you'd like to proceed anyway, re-run with --force");
    return;
  }

  // The TypeScript flag is there to short circuit this prompt, but if it's false
  // we should ask just in case.
  if (!ts) {
    ts = await confirm({ message: 'Is this a TypeScript project?', default: true });
  }

  await createVideoDir(baseDir);

  console.log('next-video initialized in', baseDir);

  if (ts) {
    await createTSFile();
    console.log('next-video initialized for TypeScript.');
  }
}
