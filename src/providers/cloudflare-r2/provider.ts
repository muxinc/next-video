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
import { publicAccessR2Bucket } from '../../utils/r2.js';

export type CloudflareR2Metadata = {
  bucket?: string;
  endpoint?: string;
  key?: string;
};

// Why 11?
//  - Reasonable id length visually in the src URL
//  - Familiarity with the length of YouTube IDs
//  - It would take more than 300 million buckets to have a 50% chance of a collision.
//  - "These go to eleven" https://www.youtube.com/watch?v=F7IZZXQ89Oc
const createId = cuid2.init({ length: 11 });

let s3: S3Client;
let bucketName: string;
let bucketUrlPublic: string;
let accountId: string;
let endpoint: string;

async function initR2() {
  const { providerConfig } = await getVideoConfig();
  const CloudflareR2Config = providerConfig['cloudflare-r2'];

  bucketName = CloudflareR2Config?.bucket ?? '';
  bucketUrlPublic = CloudflareR2Config?.bucketUrlPublic ?? '';
  endpoint = CloudflareR2Config?.endpoint ?? '';
  accountId = endpoint.split('.')[0].replace(/^https?:\/\//, '');

  s3 ??= new S3Client({
    endpoint,
    // region does not have any impact on Cloudflare R2
    region: 'auto',
    credentials: {
      accessKeyId: CloudflareR2Config?.accessKeyId ?? env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: CloudflareR2Config?.secretAccessKey ?? env.R2_SECRET_ACCESS_KEY ?? '',
    },
  });

  if (!bucketName) {
    try {
      const bucket = await findBucket(s3, (bucket) => bucket.Name?.startsWith('next-videos-'));

      if (bucket) {
        bucketName = bucket.Name!;
        log.info(log.label('Using existing Cloudflare R2 bucket:'), bucketName);
      }
    } catch (err) {
      log.error('Error listing Cloudflare R2 buckets');
      console.error(err);
    }
  }

  if (!bucketName) {
    bucketName = `next-videos-${createId()}`;
    log.info(log.label('Creating Cloudflare R2 bucket:'), bucketName);

    try {
      await createBucket(s3, bucketName, {});
      await putBucketCors(s3, bucketName);
    } catch (err) {
      log.error('Error creating Cloudflare R2 bucket');
      console.error(err);
    }
  }

  if (!bucketUrlPublic && bucketName) {
    const cloudflareApiToken = CloudflareR2Config?.apiToken ?? env.R2_CF_API_TOKEN ?? '';
    let bucketPublicId: string;
    if (cloudflareApiToken) {
      try {
        bucketPublicId = (await publicAccessR2Bucket(accountId, bucketName, cloudflareApiToken)) ?? '';
        bucketUrlPublic = `https://${bucketPublicId}`;
      } catch (e) {
        log.error(`Error setting Public access for Cloudflare R2 bucket: ${bucketName}`);
        console.error(e);
        return;
      }
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
    status: 'uploading',
  });

  await initR2();

  if (!bucketUrlPublic) {
    log.error(
      `Public access configuration missing:
      Neither the Cloudflare API Key nor the bucketUrlPublic URL is specified for the bucket "${bucketName}".
   
      To enable public access, you must ensure one of the following:
      1. **Configure the Bucket for Public Access:**
         - Make sure the bucket "${bucketName}" is configured for public access
           and specify the public URL in the provider configuration under the key 'bucketUrlPublic'.
         - For detailed instructions, refer to the Cloudflare documentation: 
           https://developers.cloudflare.com/r2/buckets/public-buckets/
   
      2. **Provide a Cloudflare API Key:**
         - You can specify a Cloudflare API Key with R2 Admin read & write permissions using the environment variable: R2_CF_API_TOKEN.
         - This API Key will allow us to enable public access for the bucket and retrieve the public URL using the Cloudflare API.
         - To create an API Token, visit:
           https://dash.cloudflare.com/?to=/:account/r2/api-tokens`
    );
    return;
  }

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

  await initR2();

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
    key = await createAssetKey(filePath, 'cloudflare-r2');

    await putObject(s3, {
      ACL: 'public-read',
      Bucket: bucketName,
      Key: key,
      Body: stream,
      ContentLength: size,
    });

    if (stream instanceof ReadStream) {
      stream.close();
    }
  } catch (e) {
    log.error('Error uploading to Cloudflare R2');
    console.error(e);
    return;
  }

  log.success(log.label('File uploaded:'), `${filePath} (${size} bytes)`);

  const updatedAsset = await updateAsset(filePath, {
    status: 'ready',
    providerMetadata: {
      'cloudflare-r2': {
        endpoint,
        bucketUrlPublic,
        bucket: bucketName,
        key,
      } as CloudflareR2Metadata,
    },
  });

  const url = updatedAsset.sources?.[0].src;
  log.space(chalk.gray('>'), log.label('URL:'), url);

  return updatedAsset;
}
