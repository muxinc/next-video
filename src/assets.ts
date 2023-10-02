import { readFile, writeFile } from 'node:fs/promises';
import log from './logger.js';
import { VIDEOS_DIR } from './constants.js';

export interface Asset {
  status?: 'sourced' | 'pending' | 'uploading' | 'processing' | 'ready' | 'error';
  error?: any;
  originalFilePath?: string;
  size?: number;
  externalIds?: {
    [key: string]: string; // { uploadId, playbackId, assetId }
  };
  blurDataURL?: string;
  createdAt?: number;
  updatedAt?: number;
}

export async function getAsset(filePath: string): Promise<Asset | undefined> {
  const assetPath = getAssetConfigPath(filePath);
  const file = await readFile(assetPath);
  const asset = JSON.parse(file.toString());

  return asset;
}

export async function createAsset(filePath: string, assetDetails?: Asset): Promise<Asset | undefined> {
  const assetPath = getAssetConfigPath(filePath);

  const newAssetDetails: Asset = {
    ...assetDetails,
    status: 'pending',
    originalFilePath: filePath,
    externalIds: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    await writeFile(assetPath, JSON.stringify(newAssetDetails), { flag: 'wx' });
  } catch (err: any) {
    if (err.code === 'EEXIST') {
      log.warning('Asset file already exists, ignoring.');
      // The file already exists, and that's ok in this case. Ignore the error.
      return;
    }
    throw err;
  }

  return newAssetDetails;
}

export async function updateAsset(filePath: string, assetDetails: Asset): Promise<Asset> {
  const assetPath = getAssetConfigPath(filePath);

  const currentAsset = await getAsset(filePath);

  const newAssetDetails = {
    ...currentAsset,
    ...assetDetails,
    externalIds: {
      ...currentAsset?.externalIds,
      ...assetDetails.externalIds,
    },
    updatedAt: Date.now(),
  };

  await writeFile(assetPath, JSON.stringify(newAssetDetails));

  return newAssetDetails;
}

function getAssetConfigPath(filePath: string) {
  if (isRemote(filePath)) {
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
