import { ReadStream, createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import { fetch as uFetch } from 'undici';
import { put } from '@vercel/blob';
import chalk from 'chalk';

import { updateAsset, Asset } from '../../assets.js';
import log from '../../utils/logger.js';

export const config = {
  runtime: 'edge',
};

export type VercelBlobMetadata = {
  url?: string;
  contentType?: string;
}

export async function uploadLocalFile(asset: Asset) {
  const filePath = asset.originalFilePath;

  if (!filePath) {
    log.error('No filePath provided for asset.');
    console.error(asset);
    return;
  }

  // Handle imported remote videos.
  if (filePath && /^https?:\/\//.test(filePath)) {
    return uploadRequestedFile(asset);
  }

  if (asset.status === 'ready') {
    return;
  } else if (asset.status === 'uploading') {
    // Right now this re-starts the upload from the beginning.
    // We should probably do something smarter here.
    log.info(log.label('Resuming upload:'), filePath);
  }

  await updateAsset(filePath, {
    status: 'uploading'
  });

  const fileStats = await fs.stat(filePath);
  const stream = createReadStream(filePath);

  return putAsset(filePath, fileStats.size, stream);
}

export async function uploadRequestedFile(asset: Asset) {
  const filePath = asset.originalFilePath;

  if (!filePath) {
    log.error('No URL provided for asset.');
    console.error(asset);
    return;
  }

  if (asset.status === 'ready') {
    return;
  }

  await updateAsset(filePath, {
    status: 'uploading'
  });

  const response = await uFetch(filePath);
  const size = Number(response.headers.get('content-length'));
  const stream = response.body;

  if (!stream) {
    log.error('Error fetching the requested file:', filePath);
    return;
  }

  return putAsset(filePath, size, stream as ReadableStream);
}

async function putAsset(filePath: string, size: number, stream: ReadStream | ReadableStream) {
  log.info(log.label('Uploading file:'), `${filePath} (${size} bytes)`);

  let blob;
  try {
    blob = await put(filePath, stream, { access: 'public' });

    if (stream instanceof ReadStream) {
      stream.close();
    }
  } catch (e) {
    log.error('Error uploading to Vercel Blob');
    console.error(e);
    return;
  }

  log.success(log.label('File uploaded:'), `${filePath} (${size} bytes)`);
  log.space(chalk.gray('>'), log.label('URL:'), blob.url);

  const updatedAsset = await updateAsset(filePath, {
    status: 'ready',
    providerMetadata: {
      'vercel-blob': {
        url: blob.url,
        contentType: blob.contentType,
      } as VercelBlobMetadata
    },
  });

  const url = updatedAsset.sources?.[0].src;
  log.space(chalk.gray('>'), log.label('URL:'), url);

  return updatedAsset;
}
