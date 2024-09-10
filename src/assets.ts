import * as path from 'node:path';
import { cwd } from 'node:process';
import { stat, readFile, writeFile, mkdir } from 'node:fs/promises';
import { getVideoConfig } from './config.js';
import { deepMerge, camelCase, isRemote, toSafePath } from './utils/utils.js';
import * as transformers from './providers/transformers.js';

export interface Asset {
  status:
    | 'sourced'
    | 'pending'
    | 'uploading'
    | 'processing'
    | 'ready'
    | 'error';
  originalFilePath: string;
  // TODO: should we add a `filePath` field which would store the file path
  // without the configurable folder? This would allow us to change the folder
  // without having to update the file paths in the assets.
  // filePath?: string;
  provider: string;
  providerMetadata?: {
    [provider: string]: { [key: string]: any };
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

  // Allow any other properties to be added to the asset so properties like
  // `thumbnailTime` can be added to the asset after the client-side transform.
  [x: string]: unknown;
}

export interface AssetSource {
  src: string;
  type?: string;
}

export async function getAsset(filePath: string): Promise<Asset | undefined> {
  const videoConfig = await getVideoConfig();
  const assetConfigPath = await getAssetConfigPath(filePath);
  return videoConfig.loadAsset(assetConfigPath)
}

export async function getAssetConfigPath(filePath: string) {
  return `${await getAssetPath(filePath)}.json`;
}

async function getAssetPath(filePath: string) {
  if (!isRemote(filePath)) return filePath;

  const { folder, remoteSourceAssetPath = defaultRemoteSourceAssetPath } =
    await getVideoConfig();

  if (!folder) throw new Error('Missing video `folder` config.');

  // Add the asset directory and make remote url a safe file path.
  return path.join(folder, remoteSourceAssetPath(filePath));
}

function defaultRemoteSourceAssetPath(url: string) {
  const urlObj = new URL(url);
  // Strip the https from the asset path.
  // Strip the search params from the file path so in most cases it'll
  // have a video file extension and not a query string in the end.
  return toSafePath(decodeURIComponent(`${urlObj.hostname}${urlObj.pathname}`));
}

export async function createAsset(
  filePath: string,
  assetDetails?: Partial<Asset>
) {
  const videoConfig = await getVideoConfig();
  const assetConfigPath = await getAssetConfigPath(filePath);

  let originalFilePath = filePath;
  if (!isRemote(filePath)) {
    originalFilePath = path.relative(cwd(), filePath);
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
    await mkdir(path.dirname(assetConfigPath), { recursive: true });
    await writeFile(assetConfigPath, JSON.stringify(newAssetDetails), {
      flag: 'wx',
    });
  } catch (err: any) {
    if (err.code === 'EEXIST') {
      // The file already exists, and that's ok in this case. Ignore the error.
      return;
    }
    throw err;
  }

  return newAssetDetails;
}

export async function updateAsset(
  filePath: string,
  assetDetails: Partial<Asset>
) {
  const assetConfigPath = await getAssetConfigPath(filePath);
  const currentAsset = await getAsset(filePath);

  if (!currentAsset) {
    throw new Error(`Asset not found: ${filePath}`);
  }

  let newAssetDetails = deepMerge(currentAsset, assetDetails, {
    updatedAt: Date.now(),
  }) as Asset;

  newAssetDetails = transformAsset(transformers, newAssetDetails);

  await writeFile(assetConfigPath, JSON.stringify(newAssetDetails));

  return newAssetDetails;
}

type TransformerRecord = Record<
  string,
  {
    transform: (asset: Asset, props?: any) => Asset;
  }
>;

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
