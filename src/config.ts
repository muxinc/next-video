import { env } from 'node:process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Video configurations
 */
export type VideoConfigComplete = {

  /** The folder in your project where you will put all video source files. */
  folder: string;

  /** The route of the video API request for string video source URLs. */
  path: string;

  /* The default provider that will deliver your video. */
  provider: string;

  /* Config by provider. */
  providerConfig: {
    backblaze?: {
      endpoint: string;
      bucket?: string;
    },
    'amazon-s3'?: {
      endpoint: string;
      bucket?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
    },
  }
}

export type VideoConfig = Partial<VideoConfigComplete>;

export const videoConfigDefault: VideoConfigComplete = {
  folder: 'videos',
  path: '/api/video',
  provider: 'mux',
  providerConfig: {},
}

/**
 * The video config is set in `next.config.js` and passed to the `withNextVideo` function.
 * The video config is then stored as an environment variable __NEXT_VIDEO_OPTS.
 */
export async function getVideoConfig(): Promise<VideoConfigComplete> {
  if (!env['__NEXT_VIDEO_OPTS']) {
    // Import the app's next.config.(m)js file so the env variable
    // __NEXT_VIDEO_OPTS set in with-next-video.ts can be used.
    try {
      await importConfig('next.config.js');
    } catch {
      try {
        await importConfig('next.config.mjs');
      } catch {
        console.error('Failed to load next.config.js or next.config.mjs');
      }
    }
  }
  return JSON.parse(env['__NEXT_VIDEO_OPTS'] ?? '{}');
}

async function importConfig(file: string) {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const absFilePath = path.resolve(file);
  // Windows uses backslashes, so we need to replace them
  // with forward slashes for the dynamic import statement to work.
  const filePath = path
    .relative(dirname, absFilePath)
    .split(path.sep)
    .join('/');
  console.log(filePath);
  return import(/* webpackIgnore: true */ `${filePath}`);
}
