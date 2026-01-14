import { NextVideo } from 'next-video/process';
import { readFile } from 'fs/promises';

export const { GET, POST, handler, withNextVideo } = NextVideo({
  loadAsset: async function (assetPath) {
    console.warn(99, assetPath);
    const file = await readFile(assetPath);
    const asset = JSON.parse(file.toString());
    return asset;
  },
  provider: 'mux',
  providerConfig: {
    mux: {
      videoQuality: 'premium',
    },
  },
});
