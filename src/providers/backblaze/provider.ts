import { ReadStream, createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import fs from 'node:fs/promises';
import { env } from 'node:process';
import { fetch as uFetch } from 'undici';
import chalk from 'chalk';
import cuid2 from '@paralleldrive/cuid2';
import { S3Client } from '@aws-sdk/client-s3';

import { updateAsset, Asset } from '../../assets.js';
import { getVideoConfig } from '../../config.js';
import { findBucket, createBucket, putBucketCors, putObject } from '../../utils/s3.js';
import { createAssetKey } from '../../utils/provider.js';
import { isRemote } from '../../utils/utils.js';
import log from '../../utils/logger.js';

export type BackblazeMetadata = {
  bucket?: string;
  endpoint?: string;
  key?: string;
}

// Why 11?
//  - Reasonable id length visually in the src URL
//  - Familiarity with the length of YouTube IDs
//  - It would take more than 300 million buckets to have a 50% chance of a collision.
//  - "These go to eleven" https://www.youtube.com/watch?v=F7IZZXQ89Oc
const createId = cuid2.init({ length: 11 });

let s3: S3Client;
let bucketName: string;
let endpoint: string;

async function initS3() {
  const { providerConfig } = await getVideoConfig();
  const backblazeConfig = providerConfig.backblaze;
  bucketName = backblazeConfig?.bucket ?? '';
  endpoint = backblazeConfig?.endpoint ?? '';

  const regionMatch = endpoint.match(/\.([a-z0-9-]+)\.backblazeb2\.com$/);
  const region =  regionMatch ? regionMatch[1] : '';

  s3 ??= new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: backblazeConfig?.accessKeyId ?? env.BACKBLAZE_ACCESS_KEY_ID ?? '',
      secretAccessKey: backblazeConfig?.secretAccessKey ?? env.BACKBLAZE_SECRET_ACCESS_KEY ?? '',
    }
  });

  if (!bucketName) {
    try {
      const bucket = await findBucket(s3, bucket => bucket.Name?.startsWith('next-videos-'));

      if (bucket) {
        bucketName = bucket.Name!;
        log.info(log.label('Using existing Backblaze bucket:'), bucketName);
      }
    } catch (err) {
      log.error('Error listing Backblaze buckets');
      console.error(err);
    }
  }

  if (!bucketName) {
    bucketName = `next-videos-${createId()}`;
    log.info(log.label('Creating Backblaze bucket:'), bucketName);

    try {
      await createBucket(s3, bucketName, {
        ACL: 'public-read',
      });
      await putBucketCors(s3, bucketName);
    } catch (err) {
      log.error('Error creating Backblaze bucket');
      console.error(err);
    }
  }
}

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
    status: 'uploading'
  });

  await initS3();

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

  await initS3();

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

  let key;
  try {
    key = await createAssetKey(filePath, 'backblaze');

    await putObject(s3, {
      Bucket: bucketName,
      Key: key,
      Body: stream,
      ContentLength: size,
    });

    if (stream instanceof ReadStream) {
      stream.close();
    }
  } catch (e) {
    log.error('Error uploading to Backblaze B2');
    console.error(e);
    return;
  }

  log.success(log.label('File uploaded:'), `${filePath} (${size} bytes)`);

  const updatedAsset = await updateAsset(filePath, {
    status: 'ready',
    providerMetadata: {
      backblaze: {
        endpoint,
        bucket: bucketName,
        key,
      } as BackblazeMetadata
    },
  });

  const url = updatedAsset.sources?.[0].src;
  log.space(chalk.gray('>'), log.label('URL:'), url);

  return updatedAsset;
}
