import { Argv, Arguments } from 'yargs';

import { stat, readdir } from 'node:fs/promises';
import path from 'node:path';

import { callHandlers } from '../main.js';
import { Asset, createAsset } from '../assets.js';

export const command = 'upload';
export const desc = 'Checks for new video files in the files directory and uploads them.';

export function builder(yargs: Argv) {
  return yargs.options({
    dir: {
      alias: 'd',
      describe: 'The directory you initialized next-video with.',
      type: 'string',
      default: 'video',
    },
  });
}

export async function handler(argv: Arguments) {
  const directoryPath = path.join(process.cwd(), argv.dir as string, 'files');

  try {
    const files = await readdir(directoryPath);

    const jsonFiles = files.filter((file) => file.endsWith('.json'));
    const otherFiles = files.filter((file) => !file.endsWith('.json'));

    const processor = async (file: string) => {
      console.log('Processing file:', file);

      const absolutePath = path.join(directoryPath, file);
      const relativePath = path.relative(process.cwd(), absolutePath);
      const stats = await stat(absolutePath);

      const newAsset = await createAsset(relativePath, {
        size: stats.size,
      });

      if (newAsset) {
        return callHandlers('local.video.added', newAsset);
      }
    };

    const unprocessedFilter = (file: string) => {
      const jsonFile = `${file}.json`;
      return !jsonFiles.includes(jsonFile);
    };

    const unprocessedVideos = otherFiles.filter(unprocessedFilter);

    console.log(`Found ${unprocessedVideos.length} unprocessed videos.`);

    const processing = await Promise.all(unprocessedVideos.map(processor));

    console.log(processing.flat());
  } catch (err) {
    console.error(`Error reading directory: ${err}`);
  }
}
