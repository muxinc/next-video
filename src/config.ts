import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cwd } from 'node:process';
import type { NextConfig } from 'next';
import { Asset } from './assets';

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

  /* An function to retrieve asset data, by default use the filesystem */
  loadAsset: (assetPath: string) => Promise<Asset | undefined>;

  /* An function to save asset data, by default use the filesystem */
  saveAsset: (assetPath: string, asset: Asset) => Promise<void>;

  /* An function to update asset data, by default use the filesystem */
  updateAsset: (assetPath: string, asset: Asset) => Promise<void>;

  /* An optional function to generate the local asset path for remote sources. */
  remoteSourceAssetPath?: (url: string) => string;
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
  loadAsset: async function (assetPath: string): Promise<Asset | undefined> {
    const file = await readFile(assetPath);
    const asset = JSON.parse(file.toString());
    return asset;
  },
  saveAsset: async function (assetPath: string, asset: Asset): Promise<void> {
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
  updateAsset: async function (assetPath: string, asset: Asset): Promise<void> {
    await writeFile(assetPath, JSON.stringify(asset));
  }
};

declare global {
  var __nextVideo: {
    configComplete: VideoConfigComplete;
    configIsDefined: boolean;
  }
}

// globalThis is used here because in Next 15 when a next.config.ts is transpiled and imported
// I believe this module is imported again in a different context and the module state is lost.

globalThis.__nextVideo = {
  configComplete: videoConfigDefault,
  configIsDefined: false
};

export function setVideoConfig(videoConfig?: VideoConfig): VideoConfigComplete {
  globalThis.__nextVideo.configIsDefined = true;
  globalThis.__nextVideo.configComplete = { ...videoConfigDefault, ...videoConfig };
  return globalThis.__nextVideo.configComplete;
}

/**
 * The video config is set in `next.config.js` and passed to the `withNextVideo` function.
 * The video config is then stored via the `setVideoConfig` function.
 */
export async function getVideoConfig(): Promise<VideoConfigComplete> {
  // This condition is only true for the next-video CLI commands.
  if (!globalThis.__nextVideo.configIsDefined) {
    const nextConfigModule = (await import(/* webpackIgnore: true */ 'next/dist/server/config.js')).default;
    const loadNextConfig = ((nextConfigModule as any).default ?? nextConfigModule) as typeof nextConfigModule;
    await loadNextConfig('phase-development-server', cwd());
  }
  return globalThis.__nextVideo.configComplete;
}
