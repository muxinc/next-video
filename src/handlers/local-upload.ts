// Right now, this thing does nothing with timeouts. It should.
// We probably want to migrate this from being a stateless function to a stateful function.
// Also really need to do a ton of work to make this more resilient around retries, etc.

import fs from 'node:fs/promises';
import path from 'node:path';

import chalk from 'chalk';
import Mux from '@mux/mux-node';
import { fetch as uFetch } from 'undici';
import sharp from 'sharp';

import { updateAsset, Asset } from '../assets.js';
import * as log from '../logger.js';

let mux: Mux;

// We don't want to blow things up immediately if Mux isn't configured, but we also don't want to
// need to initialize it every time in situations like polling. So we'll initialize it lazily but cache
// the instance.
function initMux() {
  mux = new Mux();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollForAssetReady(filePath: string, asset: Asset) {
  if (!asset.externalIds?.assetId) {
    log.error('No assetId provided for asset.');
    console.error(asset);
    return;
  }

  initMux();

  const assetId = asset.externalIds?.assetId;

  const muxAsset = await mux.video.assets.retrieve(assetId);
  const playbackId = muxAsset.playback_ids?.[0].id;

  let updatedAsset: Asset = asset;
  if (asset.externalIds?.playbackId !== playbackId) {
    // We can go ahead and update it here so we have the playback ID, even before the Asset is ready.
    updatedAsset = await updateAsset(filePath, {
      externalIds: {
        playbackId,
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
      blurDataURL = await createThumbHash(`https://image.mux.com/${playbackId}/thumbnail.png?width=100&height=100`);
    } catch (e) {
      log.error('Error creating a thumbnail hash.');
    }

    log.success(log.label('Asset is ready:'), filePath);
    log.space(chalk.gray('>'), log.label('Playback ID:'), playbackId);

    return updateAsset(filePath, {
      status: 'ready',
      externalIds: {
        playbackId,
      },
      blurDataURL,
    });

    // TODO: do we want to do something like `callHandlers('video.asset.ready', asset)` here? It'd be faking the webhook.
  } else {
    // We should also do something in here that allows us to complain loudly if the server is killed before we get here.
    await sleep(1000);
    return pollForAssetReady(filePath, updatedAsset);
  }
}

async function pollForUploadAsset(filePath: string, asset: Asset) {
  if (!asset.externalIds?.uploadId) {
    log.error('No uploadId provided for asset.');
    console.error(asset);
    return;
  }

  initMux();

  const uploadId = asset.externalIds?.uploadId;

  const muxUpload = await mux.video.uploads.retrieve(uploadId);

  if (muxUpload.asset_id) {
    log.info(log.label('Asset is processing:'), filePath);
    log.space(chalk.gray('>'), log.label('Mux Asset ID:'), muxUpload.asset_id);

    const processingAsset = await updateAsset(filePath, {
      status: 'processing',
      externalIds: {
        assetId: muxUpload.asset_id,
      },
    });

    return pollForAssetReady(filePath, processingAsset);
  } else {
    // We should do something in here that allows us to complain loudly if the server is killed before we get here.
    await sleep(1000);
    return pollForUploadAsset(filePath, asset);
  }
}

export default async function uploadLocalFile(asset: Asset) {
  if (!asset.originalFilePath) {
    log.error('No filePath provided for asset.');
    console.error(asset);
    return;
  }

  initMux();

  if (asset.status === 'ready') {
    return;
  } else if (asset.status === 'processing') {
    log.info(log.label('Asset is already processing. Polling for completion:'), asset.originalFilePath);
    return pollForAssetReady(asset.originalFilePath, asset);
  } else if (asset.status === 'uploading') {
    // Right now this re-starts the upload from the beginning.
    // We should probably do something smarter here.
    log.info(log.label('Resuming upload:'), asset.originalFilePath);
  }

  const src = asset.originalFilePath;

  // Create a direct upload url
  const upload = await mux.video.uploads.create({
    cors_origin: '*',
    // @ts-ignore
    new_asset_settings: {
      playback_policy: ['public'],
    },
  });

  await updateAsset(src, {
    status: 'uploading',
    externalIds: {
      uploadId: upload.id as string, // more typecasting while we use the beta mux sdk
    },
  });

  // get the file locally and such
  const filePath = path.join(src);
  const fileDescriptor = await fs.open(filePath);
  const fileStats = await fileDescriptor.stat();
  const stream = fileDescriptor.createReadStream();

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
    await fileDescriptor.close();
  } catch (e) {
    log.error('Error creating a Mux Direct Upload');
  }

  log.success(log.label('File uploaded:'), `${filePath} (${fileStats.size} bytes)`);
  const processingAsset = await updateAsset(src, {
    status: 'processing',
  });

  return pollForUploadAsset(src, processingAsset);
}

async function createThumbHash(imgUrl: string) {
  const response = await uFetch(imgUrl);
  const buffer = await response.arrayBuffer();

  const { data, info } = await sharp(buffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  // thumbhash is ESM only so dynamically import it.
  const { rgbaToThumbHash, thumbHashToDataURL } = await import('thumbhash');

  const hash = rgbaToThumbHash(info.width, info.height, data);

  return thumbHashToDataURL(hash);
}
