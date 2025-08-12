import { ReadStream, createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import fs from 'node:fs/promises';
import { env } from 'node:process';
import { fetch as uFetch } from 'undici';
import chalk from 'chalk';
import { v2 as cloudinary } from 'cloudinary';

import { updateAsset, Asset } from '../../assets.js';
import { getVideoConfig } from '../../config.js';
import { isRemote } from '../../utils/utils.js';
import log from '../../utils/logger.js';

export type CloudinaryMetadata = {
  publicId?: string;
  url?: string;
  secureUrl?: string;
};

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export async function uploadLocalFile(asset: Asset) {
  const filePath = asset.originalFilePath;

  if (!filePath) {
    log.error('No filePath provided for asset.');
    console.error(asset);
    return;
  }

  // Handle imported remote videos.
  if (isRemote(filePath)) {
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
    status: 'uploading',
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
    status: 'uploading',
  });

  const response = await uFetch(filePath);
  const size = Number(response.headers.get('content-length'));
  const stream = response.body;

  if (!stream) {
    log.error('Error fetching the requested file:', filePath);
    return;
  }

  return putAsset(filePath, size, Readable.fromWeb(stream));
}

async function putAsset(filePath: string, size: number, stream: ReadStream | Readable) {
  log.info(log.label('Uploading file:'), `${filePath} (${size} bytes)`);

  let result;
  try {
    result = await cloudinary.uploader.upload_stream(
      { resource_type: 'video' },
      (error, result) => {
        if (error) {
          log.error('Error uploading to Cloudinary');
          console.error(error);
          return;
        }

        log.success(log.label('File uploaded:'), `${filePath} (${size} bytes)`);
        log.space(chalk.gray('>'), log.label('URL:'), result.secure_url);

        updateAsset(filePath, {
          status: 'ready',
          providerMetadata: {
            cloudinary: {
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
            } as CloudinaryMetadata,
          },
        });
      }
    );

    stream.pipe(result);
  } catch (e) {
    log.error('Error uploading to Cloudinary');
    console.error(e);
    return;
  }

  if (stream instanceof ReadStream) {
    stream.close();
  }

  return;
}
