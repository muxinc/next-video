import assert from 'node:assert';
import { test } from 'node:test';
import { transform } from '../../../src/providers/mux/transformer.js';
import type { Asset } from '../../../src/assets.js';

test('transform', async () => {
  const asset: Asset = {
    status: 'ready',
    originalFilePath: '/videos/get-started.mp4',
    createdAt: 0,
    updatedAt: 0,
    provider: 'mux',
    providerMetadata: {
      mux: {
        playbackId: 'playbackId',
      },
    },
  };

  const transformedAsset = transform(asset, {
    customDomain: 'custom-mux.com',
    thumbnailTime: 20,
  });

  assert.deepStrictEqual(transformedAsset, {
    ...asset,
    sources: [{ src: 'https://stream.custom-mux.com/playbackId.m3u8', type: 'application/x-mpegURL' }],
    poster: 'https://image.custom-mux.com/playbackId/thumbnail.webp?time=20',
    thumbnailTime: 20,
  });
});
