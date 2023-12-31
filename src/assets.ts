import { relative } from 'node:path';
import { cwd } from 'node:process';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { getVideoConfig } from './config.js';
import { deepMerge, camelCase } from './utils/utils.js';
import * as transformers from './providers/transformers.js';

export interface Asset {
  status: 'sourced' | 'pending' | 'uploading' | 'processing' | 'ready' | 'error';
  originalFilePath: string;
  provider: string;
  providerMetadata?: {
    [provider: string]: { [key: string]: any }
  };
  poster?: string;
  sources?: AssetSource[];
  blurDataURL?: string;
  size?: number;
  error?: any;
  createdAt: number;
  updatedAt: number;

  // Here for backwards compatibility with older assets.
  externalIds?: {
    [key: string]: string; // { uploadId, playbackId, assetId }
  };
}

export interface AssetSource {
  src: string;
  type?: string;
}

export async function getAsset(filePath: string): Promise<Asset | undefined> {
  const assetPath = await getAssetConfigPath(filePath);
  const file = await readFile(assetPath);
  const asset = JSON.parse(file.toString());
  return asset;
}

export async function createAsset(filePath: string, assetDetails?: Partial<Asset>) {
  const videoConfig = await getVideoConfig();
  const assetPath = await getAssetConfigPath(filePath);

  let originalFilePath = filePath;
  if (!isRemote(filePath))  {
    originalFilePath = relative(cwd(), filePath);
  }

  const newAssetDetails: Asset = {
    status: 'pending', // overwritable
    ...assetDetails,
    originalFilePath,
    provider: videoConfig.provider,
    providerMetadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (!isRemote(filePath)) {
    try {
      newAssetDetails.size = (await stat(filePath))?.size;
    } catch {
      // Ignore error.
    }
  }

  try {
    await writeFile(assetPath, JSON.stringify(newAssetDetails), { flag: 'wx' });
  } catch (err: any) {
    if (err.code === 'EEXIST') {
      // The file already exists, and that's ok in this case. Ignore the error.
      return;
    }
    throw err;
  }

  return newAssetDetails;
}

export async function updateAsset(filePath: string, assetDetails: Partial<Asset>) {
  const assetPath = await getAssetConfigPath(filePath);
  const currentAsset = await getAsset(filePath);

  if (!currentAsset) {
    throw new Error(`Asset not found: ${filePath}`);
  }

  let newAssetDetails = deepMerge(currentAsset, assetDetails, {
    updatedAt: Date.now(),
  }) as Asset;

  newAssetDetails = transformAsset(transformers, newAssetDetails);

  await writeFile(assetPath, JSON.stringify(newAssetDetails));

  return newAssetDetails;
}

export async function getAssetConfigPath(filePath: string) {
  if (isRemote(filePath)) {
    const VIDEOS_DIR = (await getVideoConfig()).folder;
    if (!VIDEOS_DIR) throw new Error('Missing video `folder` config.');

    // Add the asset directory and make remote url a safe file path.
    return `${VIDEOS_DIR}/${toSafePath(filePath)}.json`;
  }
  return `${filePath}.json`
}

function isRemote(filePath: string) {
  return /^https?:\/\//.test(filePath);
}

function toSafePath(str: string) {
  return str
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_');
}

type TransformerRecord = Record<string, {
  transform: (asset: Asset, props?: any) => Asset;
}>;

function transformAsset(transformers: TransformerRecord, asset: Asset) {
  const provider = asset.provider;
  if (!provider) return asset;

  for (let [key, transformer] of Object.entries(transformers)) {
    if (key === camelCase(provider)) {
      return transformer.transform(asset);
    }
  }

  return asset;
}
