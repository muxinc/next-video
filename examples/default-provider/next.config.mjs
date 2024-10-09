import { withNextVideo } from 'next-video/process';
import { readFile } from 'node:fs/promises';

/** @type {import('next').NextConfig} */
const nextConfig = (phase, { defaultConfig }) => {
  return {
    ...defaultConfig,
  };
};

export default withNextVideo(nextConfig, {
  loadAsset: async function (assetPath) {
    console.warn(99, assetPath);
    const file = await readFile(assetPath);
    const asset = JSON.parse(file.toString());
    return asset;
  },
});

// Amazon S3 example
// export default withNextVideo(nextConfig, {
//   provider: 'amazon-s3',
//   providerConfig: {
//     'amazon-s3': {
//       endpoint: 'https://s3.us-east-1.amazonaws.com',
//     }
//   },
// });
