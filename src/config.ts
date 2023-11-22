import { env } from 'node:process';
import path from 'node:path';

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
}

export type VideoConfig = Partial<VideoConfigComplete>;

export const videoConfigDefault: VideoConfigComplete = {
  folder: 'videos',
  path: '/api/video',
  provider: 'mux',
}

/**
 * The video config is set in `next.config.js` and passed to the `withNextVideo` function.
 * The video config is then stored as an environment variable __NEXT_VIDEO_OPTS.
 */
export async function getVideoConfig(): Promise<VideoConfigComplete> {
  if (!env['__NEXT_VIDEO_OPTS']) {
    // Import the app's next.config.js file so the env variable
    // __NEXT_VIDEO_OPTS set in with-next-video.ts can be used.
    try {
      await import(path.resolve('next.config.js'))
    } catch {
      console.error('Failed to load next.config.js');
    }
  }
  return JSON.parse(env['__NEXT_VIDEO_OPTS'] ?? '{}');
}
