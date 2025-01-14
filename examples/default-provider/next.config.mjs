import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withNextVideo } from './next-video.mjs';

const fileDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = (phase, { defaultConfig }) => {
  return {
    ...defaultConfig,
    // Needed for Turbopack and symlinking to work
    // https://github.com/vercel/next.js/issues/64472#issuecomment-2077483493
    // https://nextjs.org/docs/pages/api-reference/config/next-config-js/output#caveats
    outputFileTracingRoot: path.join(fileDir, '../../'),
  };
};

export default withNextVideo(nextConfig);

// Amazon S3 example
// export default withNextVideo(nextConfig, {
//   provider: 'amazon-s3',
//   providerConfig: {
//     'amazon-s3': {
//       endpoint: 'https://s3.us-east-1.amazonaws.com',
//     }
//   },
// });
