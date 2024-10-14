import assert from 'node:assert';
import { test } from 'node:test';
import { setVideoConfig } from '../../src/config.js'
import { createAssetKey } from '../../src/utils/provider.js';

test('createAssetKey w/ defaultGenerateAssetKey and local asset', async () => {
  setVideoConfig({
    folder: 'videos',
    providerConfig: {
      'vercel-blob': {},
    },
  });

  assert.equal(
    await createAssetKey('/videos/get-started.mp4', 'vercel-blob'),
    '/videos/get-started.mp4'
  );

  setVideoConfig({});
});

test('createAssetKey w/ defaultGenerateAssetKey and remote asset', async () => {
  setVideoConfig({
    folder: 'videos',
    providerConfig: {
      'vercel-blob': {},
    },
  });

  assert.equal(
    await createAssetKey('https://storage.googleapis.com/muxdemofiles/mux.mp4', 'vercel-blob'),
    'videos/mux.mp4'
  );

  setVideoConfig({});
});

test('createAssetKey w/ custom generateAssetKey and remote asset', async () => {
  setVideoConfig({
    folder: 'videos',
    providerConfig: {
      'vercel-blob': {
        generateAssetKey: (filePathOrURL, folder) => {
          const url = new URL(filePathOrURL);
          return `${folder}/remote${url.pathname}`;
        },
      },
    },
  });

  assert.equal(
    await createAssetKey('https://storage.googleapis.com/muxdemofiles/mux.mp4', 'vercel-blob'),
    'videos/remote/muxdemofiles/mux.mp4'
  );

  setVideoConfig({});
});
