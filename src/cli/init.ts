import { Argv, Arguments } from 'yargs';

import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const GITIGNORE_CONTENTS = `files/*
!files/*.json`;

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

export const command = 'init [dir]';
export const desc = 'Initializes next-video in a project.';
export function builder(yargs: Argv) {
  return yargs
    .positional('dir', {
      describe:
        'The directory to use for your video-related files (including, but not limited to, the videos themselves.',
      default: 'video',
    })
    .options({
      force: {
        alias: 'f',
        describe: 'Continue with initialization even if the chosen directory already exists.',
        type: 'boolean',
        default: false,
      },
    }); // We also need to add the typescript check and add the `next-video.d.ts` file.
}
export async function handler(argv: Arguments) {
  let baseDir = argv.dir as string;

  const shouldContinue = await preInitCheck(baseDir);
  if (!argv.force && !shouldContinue) {
    console.log('Directory already exists:', baseDir);
    console.log("If you'd like to proceed anyway, re-run with --force");
    return;
  }

  await createVideoDir(baseDir);

  console.log('next-video initialized in', baseDir);
}
