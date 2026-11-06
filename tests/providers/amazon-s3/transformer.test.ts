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

for (const [key, pathname] of [
  ['videos/demo.mp4', '/videos/demo.mp4'],
  ['videos/demo%20clip.mp4', '/videos/demo%2520clip.mp4'],
  ['videos/100%.mp4', '/videos/100%25.mp4'],
  ['videos/demo clip.mp4', '/videos/demo%20clip.mp4'],
  ['videos/café?#.mp4', '/videos/caf%C3%A9%3F%23.mp4'],
]) {
  test(`transform preserves object key ${key}`, () => {
    const asset: Asset = {
      status: 'ready',
      originalFilePath: '/videos/get-started.mp4',
      createdAt: 0,
      updatedAt: 0,
      provider: 'amazon-s3',
      providerMetadata: {
        ['amazon-s3']: {
          endpoint: 'https://storage.example.com',
          bucket: 'bucket',
          key,
        },
      },
    };

    const src = new URL(transform(asset).sources![0].src);

    assert.strictEqual(src.pathname, pathname);
    assert.strictEqual(decodeURIComponent(src.pathname.slice(1)), key);
    assert.strictEqual(src.search, '');
    assert.strictEqual(src.hash, '');
  });
}
