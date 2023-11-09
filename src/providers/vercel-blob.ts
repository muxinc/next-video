import fs from 'node:fs/promises';
import path from 'node:path';
import { fetch as uFetch } from 'undici';
import { put, head } from '@vercel/blob';
import chalk from 'chalk';

import { updateAsset, Asset } from '../assets.js';
import log from '../logger.js';


export const config = {
  runtime: 'edge',
};

export async function uploadLocalFile(asset: Asset) {
  if (!asset.originalFilePath) {
    log.error('No filePath provided for asset.');
    console.error(asset);
    return;
  }

  if (asset.status === 'ready') {
    return;
  } else if (asset.status === 'uploading') {
    // Right now this re-starts the upload from the beginning.
    // We should probably do something smarter here.
    log.info(log.label('Resuming upload:'), asset.originalFilePath);
  }

  const src = asset.originalFilePath;

  await updateAsset(src, {
    status: 'uploading'
  });

  // Imported remote videos can take an easy path.
  if (src && /^https?:\/\//.test(src)) {
    return uploadRequestedFile(asset);
  }

  // get the file locally and such
  const filePath = path.join(src);
  const fileDescriptor = await fs.open(filePath);
  const fileStats = await fileDescriptor.stat();
  const stream = fileDescriptor.createReadStream();

  log.info(log.label('Uploading file:'), `${filePath} (${fileStats.size} bytes)`);

  let blob;
  try {
    blob = await put(asset.originalFilePath, stream, { access: 'public' });
    stream.close();
    await fileDescriptor.close();
  } catch (e) {
    log.error('Error uploading to the Vercel Blob store');
    console.error(e);
    return;
  }

  log.success(log.label('File uploaded:'), `${filePath} (${fileStats.size} bytes)`);
  log.space(chalk.gray('>'), log.label('URL:'), blob.url);

  return updateAsset(src, {
    status: 'ready',
    externalIds: {
      url: blob.url,
    },
  });
}

export async function uploadRequestedFile(asset: Asset) {
  if (!asset.originalFilePath) {
    log.error('No URL provided for asset.');
    console.error(asset);
    return;
  }

  if (asset.status === 'ready') {
    return;
  }

  const src = asset.originalFilePath;
  const fileName = path.basename(src);
  const stream = (await uFetch(src)).body;

  if (!stream) {
    log.error('Error fetching the requested file:', src);
    return;
  }

  log.info(log.label('Uploading file:'), src);

  let blob;
  try {
    // @ts-ignore
    blob = await put(fileName, stream, { access: 'public' });
  } catch (e) {
    log.error('Error uploading to the Vercel Blob store');
    console.error(e);
    return;
  }

  log.success(log.label('File uploaded:'), src);
  log.space(chalk.gray('>'), log.label('URL:'), blob.url);

  return updateAsset(src, {
    status: 'ready',
    externalIds: {
      url: blob.url,
    },
  });
}
