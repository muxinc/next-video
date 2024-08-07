import { cwd } from 'node:process';
import path from 'node:path';
import { stat, readFile, writeFile, mkdir } from 'node:fs/promises';

import { pathToFileURL } from 'node:url';
import nextConfig from 'next/config.js';
import type { NextConfig } from 'next';
import { Asset } from './assets';
// @ts-ignore
const getConfig = nextConfig.default;

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

  loadAsset: (path: string) => Promise<Asset>;
  saveAsset: (path: string, asset: Asset) => Promise<void>;
};

export type ProviderConfig = {
  mux?: {
    generateAssetKey: undefined;
  };

  'vercel-blob'?: {
    /* An optional function to generate the bucket asset key. */
    generateAssetKey?: (filePathOrURL: string, folder: string) => string;
  };

  backblaze?: {
    endpoint: string;
    bucket?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    /* An optional function to generate the bucket asset key. */
    generateAssetKey?: (filePathOrURL: string, folder: string) => string;
  };

  'amazon-s3'?: {
    endpoint: string;
    bucket?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    /* An optional function to generate the bucket asset key. */
    generateAssetKey?: (filePathOrURL: string, folder: string) => string;
  };
};

export type VideoConfig = Partial<VideoConfigComplete>;

export const videoConfigDefault: VideoConfigComplete = {
  folder: 'videos',
  path: '/api/video',
  provider: 'mux',
  providerConfig: {},
  loadAsset: async (path) => {
    const file = await readFile(path);
    const asset = JSON.parse(file.toString());
    return asset;
  },
  saveAsset: async (assetPath, asset) => {
    try {
      await mkdir(path.dirname(assetPath), { recursive: true });
      await writeFile(assetPath, JSON.stringify(asset), {
        flag: 'wx',
      });
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        // The file already exists, and that's ok in this case. Ignore the error.
        return;
      }
      throw err;
    }
  },
};

/**
 * The video config is set in `next.config.js` and passed to the `withNextVideo` function.
 * The video config is then stored in `serverRuntimeConfig`.
 */
export async function getVideoConfig(): Promise<VideoConfigComplete> {
  let nextConfig: NextConfig | undefined = getConfig();

  if (!nextConfig?.serverRuntimeConfig?.nextVideo) {
    try {
      nextConfig = await importConfig('next.config.js');
    } catch (err) {
      try {
        nextConfig = await importConfig('next.config.mjs');
      } catch {
        console.error('Failed to load next-video config.');
      }
    }
  }

  return nextConfig?.serverRuntimeConfig?.nextVideo;
}

async function importConfig(file: string) {
  const absFilePath = path.resolve(cwd(), file);
  const fileUrl = pathToFileURL(absFilePath).href;

  const mod = await import(/* webpackIgnore: true */ fileUrl);
  const config:
    | ((phase: string | undefined, opts: any) => Promise<NextConfig>)
    | NextConfig
    | undefined = mod?.default;

  if (typeof config === 'function') {
    return config(process.env.NEXT_PHASE, { defaultConfig: {} });
  }
  return config;
}
