// Right now, this thing does nothing with timeouts. It should.
// We probably want to migrate this from being a stateless function to a stateful function.
// Also really need to do a ton of work to make this more resilient around retries, etc.
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';

import chalk from 'chalk';
import Mux from '@mux/mux-node';
import { fetch as uFetch } from 'undici';
import { minimatch } from 'minimatch';

import { updateAsset, Asset } from '../../assets.js';
import { getVideoConfig } from '../../config.js';
import log from '../../utils/logger.js';
import { sleep } from '../../utils/utils.js';
import { Queue } from '../../utils/queue.js';

export type MuxMetadata = {
  uploadId?: string;
  assetId?: string;
  playbackId?: string;
};

export function validateNewAssetSettings(newAssetSettings: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!newAssetSettings || typeof newAssetSettings !== 'object') {
    errors.push('newAssetSettings must be an object');
    return { valid: false, errors };
  }

  if (newAssetSettings.maxResolutionTier !== undefined) {
    const validResolutions = ['1080p', '1440p', '2160p'];
    if (!validResolutions.includes(newAssetSettings.maxResolutionTier)) {
      errors.push(`maxResolutionTier must be one of: ${validResolutions.join(', ')}`);
    }
  }

  if (newAssetSettings.videoQuality !== undefined) {
    const validQualities = ['basic', 'plus', 'premium'];
    if (!validQualities.includes(newAssetSettings.videoQuality)) {
      errors.push(`videoQuality must be one of: ${validQualities.join(', ')}`);
    }
  }

  const validProperties = ['maxResolutionTier', 'videoQuality'];
  const unknownProperties = Object.keys(newAssetSettings).filter((key) => !validProperties.includes(key));
  if (unknownProperties.length > 0) {
    errors.push(`Unknown properties: ${unknownProperties.join(', ')}. Valid properties: ${validProperties.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

function getNewAssetSettings(filePath: string, muxConfig: any) {
  try {
    if (!filePath) {
      return undefined;
    }

    const normalizedFilePath = filePath.replace(/\\/g, '/');

    // 1. Check exact file path match in newAssetSettings
    if (muxConfig?.newAssetSettings?.[filePath] || muxConfig?.newAssetSettings?.[normalizedFilePath]) {
      const newAssetSettings = muxConfig.newAssetSettings[filePath] || muxConfig.newAssetSettings[normalizedFilePath];
      log.info(log.label('Asset settings:'), 'Using exact path match');
      return newAssetSettings;
    }

    // 2. Check glob pattern matches in newAssetSettings
    if (muxConfig?.newAssetSettings) {
      for (const [pattern, newAssetSettings] of Object.entries(muxConfig.newAssetSettings)) {
        if (minimatch(normalizedFilePath, pattern)) {
          log.info(log.label('Asset settings:'), 'Using pattern match');
          return newAssetSettings;
        }
      }
    }

    return undefined;
  } catch (e) {
    log.error('Error retrieving asset settings for file:', filePath);
    return undefined;
  }
}

// We don't want to blow things up immediately if Mux isn't configured,
// but we also don't want to need to initialize it every time in situations like polling.
// So we'll initialize it lazily but cache the instance.
let mux: Mux;
let queue: Queue;
function initMux() {
  mux ??= new Mux();
  queue ??= new Queue();
}

async function pollForAssetReady(filePath: string, asset: Asset) {
  const providerMetadata: MuxMetadata | undefined = asset.providerMetadata?.mux;

  if (!providerMetadata?.assetId) {
    log.error('No assetId provided for asset.');
    console.error(asset);
    return;
  }

  initMux();

  const assetId = providerMetadata?.assetId;
  const muxAsset = await mux.video.assets.retrieve(assetId);
  const playbackId = muxAsset.playback_ids?.[0].id!;

  let updatedAsset: Asset = asset;
  if (providerMetadata?.playbackId !== playbackId) {
    // We can go ahead and update it here so we have the playback ID, even before the Asset is ready.
    updatedAsset = await updateAsset(filePath, {
      providerMetadata: {
        mux: {
          playbackId,
        },
      },
    });
  }

  if (muxAsset.status === 'errored') {
    log.error(log.label('Asset errored:'), filePath);
    log.space(chalk.gray('>'), log.label('Mux Asset ID:'), assetId);

    return updateAsset(filePath, {
      status: 'error',
      error: muxAsset.errors,
    });
  }

  if (muxAsset.status === 'ready') {
    let blurDataURL;
    try {
      blurDataURL = await createThumbHash(`https://image.mux.com/${playbackId}/thumbnail.webp?width=16&height=16`);
    } catch (e) {
      log.error('Error creating a thumbnail hash.');
    }

    log.success(log.label('Asset is ready:'), filePath);
    log.space(chalk.gray('>'), log.label('Playback ID:'), playbackId);

    return updateAsset(filePath, {
      status: 'ready',
      blurDataURL,
      providerMetadata: {
        mux: {
          playbackId,
        },
      },
    });

    // TODO: do we want to do something like `callHandlers('video.asset.ready', asset)` here? It'd be faking the webhook.
  } else {
    // We should also do something in here that allows us to complain loudly if the server is killed before we get here.
    await sleep(1000);
    return pollForAssetReady(filePath, updatedAsset);
  }
}

async function pollForUploadAsset(filePath: string, asset: Asset) {
  const providerMetadata: MuxMetadata | undefined = asset.providerMetadata?.mux;

  if (!providerMetadata?.uploadId) {
    log.error('No uploadId provided for asset.');
    console.error(asset);
    return;
  }

  initMux();

  const uploadId = providerMetadata?.uploadId;
  const muxUpload = await mux.video.uploads.retrieve(uploadId);

  if (muxUpload.asset_id) {
    log.info(log.label('Asset is processing:'), filePath);
    log.space(chalk.gray('>'), log.label('Mux Asset ID:'), muxUpload.asset_id);

    const processingAsset = await updateAsset(filePath, {
      status: 'processing',
      providerMetadata: {
        mux: {
          assetId: muxUpload.asset_id,
        },
      },
    });

    return pollForAssetReady(filePath, processingAsset);
  } else {
    // We should do something in here that allows us to complain loudly if the server is killed before we get here.
    await sleep(1000);
    return pollForUploadAsset(filePath, asset);
  }
}

async function createUploadURL(filePath: string): Promise<Mux.Video.Uploads.Upload | undefined> {
  try {
    const { providerConfig } = await getVideoConfig();
    const muxConfig = providerConfig.mux;
    const newAssetSettings = getNewAssetSettings(filePath, muxConfig);

    // Create a direct upload url
    const upload = await mux.video.uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['public'],
        video_quality: newAssetSettings?.videoQuality || muxConfig?.videoQuality,
        max_resolution_tier: newAssetSettings?.maxResolutionTier,
      },
    });
    return upload;
  } catch (e) {
    if (e instanceof Error && 'status' in e && e.status === 401) {
      log.error('Unauthorized request. Check that your MUX_TOKEN_ID and MUX_TOKEN_SECRET credentials are valid.');
    } else {
      log.error('Error creating a Mux Direct Upload');
      console.error(e);
    }
    return undefined;
  }
}

export async function uploadLocalFile(asset: Asset) {
  const filePath = asset.originalFilePath;

  if (!filePath) {
    log.error('No filePath provided for asset.');
    console.error(asset);
    return;
  }

  initMux();

  if (asset.status === 'ready') {
    return;
  } else if (asset.status === 'processing') {
    log.info(log.label('Asset is already processing. Polling for completion:'), filePath);
    return pollForAssetReady(filePath, asset);
  } else if (asset.status === 'uploading') {
    // Right now this re-starts the upload from the beginning.
    // We should probably do something smarter here.
    log.info(log.label('Resuming upload:'), filePath);
  }

  // Handle imported remote videos.
  if (filePath && /^https?:\/\//.test(filePath)) {
    return uploadRequestedFile(asset);
  }

  const upload: Mux.Video.Uploads.Upload | undefined = await queue.enqueue(() => createUploadURL(filePath));
  if (!upload) {
    return;
  }

  await updateAsset(filePath, {
    status: 'uploading',
    providerMetadata: {
      mux: {
        uploadId: upload.id as string, // more typecasting while we use the beta mux sdk
      },
    },
  });

  const fileStats = await fs.stat(filePath);
  const stream = createReadStream(filePath);

  log.info(log.label('Uploading file:'), `${filePath} (${fileStats.size} bytes)`);

  try {
    // I'm having to do some annoying, defensive typecasting here becuase we need to fix some OAS spec stuff.
    await uFetch(upload.url as string, {
      method: 'PUT',
      // @ts-ignore
      body: stream,
      duplex: 'half',
    });
    stream.close();
  } catch (e) {
    log.error('Error uploading to the Mux upload URL');
    console.error(e);
    return;
  }

  log.success(log.label('File uploaded:'), `${filePath} (${fileStats.size} bytes)`);

  const processingAsset = await updateAsset(filePath, {
    status: 'processing',
  });

  return pollForUploadAsset(filePath, processingAsset);
}

export async function uploadRequestedFile(asset: Asset) {
  const filePath = asset.originalFilePath;

  if (!filePath) {
    log.error('No URL provided for asset.');
    console.error(asset);
    return;
  }

  initMux();

  if (asset.status === 'ready') {
    return;
  } else if (asset.status === 'processing') {
    log.info(log.label('Asset is already processing. Polling for completion:'), filePath);
    return pollForAssetReady(filePath, asset);
  }

  const { providerConfig } = await getVideoConfig();
  const muxConfig = providerConfig.mux;
  const newAssetSettings = getNewAssetSettings(filePath, muxConfig);

  const assetObj = await mux.video.assets.create({
    input: [
      {
        url: filePath,
      },
    ],
    playback_policy: ['public'],
    video_quality: newAssetSettings?.videoQuality || muxConfig?.videoQuality,
    max_resolution_tier: newAssetSettings?.maxResolutionTier,
  });

  log.info(log.label('Asset is processing:'), filePath);
  log.space(chalk.gray('>'), log.label('Mux Asset ID:'), assetObj.id);

  const processingAsset = await updateAsset(filePath, {
    status: 'processing',
    providerMetadata: {
      mux: {
        assetId: assetObj.id!,
      },
    },
  });

  return pollForAssetReady(filePath, processingAsset);
}

export async function createThumbHash(imgUrl: string) {
  const response = await uFetch(imgUrl);
  const buffer = await response.arrayBuffer();
  const base64String = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return `data:image/webp;base64,${base64String}`;
}
