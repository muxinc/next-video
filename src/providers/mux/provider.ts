// Right now, this thing does nothing with timeouts. It should.
// We probably want to migrate this from being a stateless function to a stateful function.
// Also really need to do a ton of work to make this more resilient around retries, etc.
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';

import chalk from 'chalk';
import Mux from '@mux/mux-node';
import { fetch as uFetch } from 'undici';

import { updateAsset, Asset } from '../../assets.js';
import log from '../../utils/logger.js';
import { sleep } from '../../utils/utils.js';

export type MuxMetadata = {
  uploadId?: string;
  assetId?: string;
  playbackId?: string;
}

// We don't want to blow things up immediately if Mux isn't configured,
// but we also don't want to need to initialize it every time in situations like polling.
// So we'll initialize it lazily but cache the instance.
let mux: Mux;
function initMux() {
  mux ??= new Mux();
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
        }
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
        }
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
        }
      },
    });

    return pollForAssetReady(filePath, processingAsset);
  } else {
    // We should do something in here that allows us to complain loudly if the server is killed before we get here.
    await sleep(1000);
    return pollForUploadAsset(filePath, asset);
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

  let upload: Mux.Video.Uploads.Upload;
  try {
    // Create a direct upload url
    upload = await mux.video.uploads.create({
      cors_origin: '*',
      // @ts-ignore
      new_asset_settings: {
        playback_policy: ['public'],
      },
    });
  } catch (e) {
    log.error('Error creating a Mux Direct Upload');
    console.error(e);
    return;
  }

  await updateAsset(filePath, {
    status: 'uploading',
    providerMetadata: {
      mux: {
        uploadId: upload.id as string, // more typecasting while we use the beta mux sdk
      }
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

  const assetObj = await mux.video.assets.create({
    // @ts-ignore
    input: [{
      url: filePath
    }],
    playback_policy: ['public']
  });

  log.info(log.label('Asset is processing:'), filePath);
  log.space(chalk.gray('>'), log.label('Mux Asset ID:'), assetObj.id);

  const processingAsset = await updateAsset(filePath, {
    status: 'processing',
    providerMetadata: {
      mux: {
        assetId: assetObj.id!,
      }
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
