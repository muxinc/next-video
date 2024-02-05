import { env, cwd } from 'node:process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Video configurations
 */
export type VideoConfigComplete = {
  /** The folder in your project where you will put all video source files. */
  folder: string;

  /** The route of the video API request for string video source URLs. */
  path: string;

  /* The default provider that will deliver your video. */
  provider: keyof ProviderConfig;

  /* Config by provider. */
  providerConfig: ProviderConfig;

  /* An optional function to generate the local asset path for remote sources. */
  remoteSourceAssetPath?: (url: string) => string;
};

export type ProviderConfig = {
  mux?: {
    generateAssetKey: undefined;
  };

  'vercel-blob'?: {
    /* An optional function to generate the bucket asset key. */
    generateAssetKey?: (filePathOrURL: string) => string;
  };

  backblaze?: {
    endpoint: string;
    bucket?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    /* An optional function to generate the bucket asset key. */
    generateAssetKey?: (filePathOrURL: string) => string;
  };

  'amazon-s3'?: {
    endpoint: string;
    bucket?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    /* An optional function to generate the bucket asset key. */
    generateAssetKey?: (filePathOrURL: string) => string;
  };
};

export type VideoConfig = Partial<VideoConfigComplete>;

export const videoConfigDefault: VideoConfigComplete = {
  folder: 'videos',
  path: '/api/video',
  provider: 'mux',
  providerConfig: {},
};

/**
 * The video config is set in `next.config.js` and passed to the `withNextVideo` function.
 * The video config is then stored as an environment variable __NEXT_VIDEO_OPTS.
 */
export async function getVideoConfig(): Promise<VideoConfigComplete> {
  let nextConfig;

  try {
    nextConfig = await importConfig('next.config.js');
  } catch (err) {
    try {
      nextConfig = await importConfig('next.config.mjs');
    } catch {
      console.error('Failed to load next.config.js or next.config.mjs');
    }
  }

  return nextConfig?.serverRuntimeConfig?.nextVideo;
}

async function importConfig(file: string) {
  const absFilePath = path.resolve(cwd(), file);
  const fileUrl = pathToFileURL(absFilePath).href;
  return (await import(/* webpackIgnore: true */ fileUrl))?.default;
}
