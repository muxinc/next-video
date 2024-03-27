import assert from 'node:assert';
import { test } from 'node:test';
import { transform } from '../../../src/providers/vercel-blob/transformer.js';
import type { Asset } from '../../../src/assets.js';

test('transform', async () => {
  const asset: Asset = {
    status: 'ready',
    originalFilePath: '/videos/get-started.mp4',
    createdAt: 0,
    updatedAt: 0,
    provider: 'vercel-blob',
    providerMetadata: {
      ['vercel-blob']: {
        url: 'https://vercel-blob-url.com/get-started.mp4',
        contentType: 'video/mp4',
      },
    },
  };

  const transformedAsset = transform(asset);

  assert.deepStrictEqual(transformedAsset, {
    ...asset,
    sources: [{ src: 'https://vercel-blob-url.com/get-started.mp4', type: 'video/mp4' }],
  });
});
