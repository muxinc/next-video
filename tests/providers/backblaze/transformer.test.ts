import assert from 'node:assert';
import { test } from 'node:test';
import { transform } from '../../../src/providers/backblaze/transformer.js';
import type { Asset } from '../../../src/assets.js';

test('transform', async () => {
  const asset: Asset = {
    status: 'ready',
    originalFilePath: '/videos/get-started.mp4',
    createdAt: 0,
    updatedAt: 0,
    provider: 'backblaze',
    providerMetadata: {
      ['backblaze']: {
        endpoint: 'https://backblaze-url.com',
        bucket: 'bucket',
        key: 'key',
      },
    },
  };

  const transformedAsset = transform(asset);

  assert.deepStrictEqual(transformedAsset, {
    ...asset,
    sources: [{ src: 'https://bucket.backblaze-url.com/key' }],
  });
});
