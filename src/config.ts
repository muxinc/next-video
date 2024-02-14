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

  /* An optional function to generate the local asset path for remote sources. */
  remoteSourceAssetPath?: (url: string) => string;
} & (
  | { 
    /* The default provider that will deliver your video. */
    provider: 'mux'; 
    /* Config by provider. */
    providerConfig: MuxProviderConfig
   }
  | { 
    /* The default provider that will deliver your video. */
    provider: 'vercel-blob'; 
    /* Config by provider. */
    providerConfig: VercelBlobProviderConfig
   }
  | { 
    /* The default provider that will deliver your video. */
    provider: 'backblaze'; 
    /* Config by provider. */
    providerConfig: BackblazeProviderConfig
   }
  | { 
    /* The default provider that will deliver your video. */
    provider: 'amazon-s3'; 
    /* Config by provider. */
    providerConfig: AmazonS3ProviderConfig
   }
);

type MuxProviderConfig = {
  generateAssetKey: undefined;
};

type VercelBlobProviderConfig = {
  /* An optional function to generate the bucket asset key. */
  generateAssetKey?: (filePathOrURL: string, folder: string) => string;
};

type BackblazeProviderConfig = {
  endpoint: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  /* An optional function to generate the bucket asset key. */
  generateAssetKey?: (filePathOrURL: string, folder: string) => string;
};

type AmazonS3ProviderConfig = {
  endpoint: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  /* An optional function to generate the bucket asset key. */
  generateAssetKey?: (filePathOrURL: string, folder: string) => string;
};

export type VideoConfig = Partial<VideoConfigComplete>;

export const videoConfigDefault: VideoConfigComplete = {
  folder: 'videos',
  path: '/api/video',
  provider: 'mux',
  providerConfig: {
    generateAssetKey: undefined,
  },
};

/**
 * The video config is set in `next.config.js` and passed to the `withNextVideo` function.
 * The video config is then stored as an environment variable __NEXT_VIDEO_OPTS.
 */
export async function getVideoConfig<T extends VideoConfig['provider']>(): Promise<Extract<VideoConfigComplete, { provider: T }>> {
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
