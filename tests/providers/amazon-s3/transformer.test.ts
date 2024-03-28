import assert from 'node:assert';
import { test } from 'node:test';
import { transform } from '../../../src/providers/amazon-s3/transformer.js';
import type { Asset } from '../../../src/assets.js';

test('transform', async () => {
  const asset: Asset = {
    status: 'ready',
    originalFilePath: '/videos/get-started.mp4',
    createdAt: 0,
    updatedAt: 0,
    provider: 'amazon-s3',
    providerMetadata: {
      ['amazon-s3']: {
        endpoint: 'https://amazon-s3-url.com',
        bucket: 'bucket',
        key: 'key',
      },
    },
  };

  const transformedAsset = transform(asset);

  assert.deepStrictEqual(transformedAsset, {
    ...asset,
    sources: [{ src: 'https://bucket.amazon-s3-url.com/key' }],
  });
});
