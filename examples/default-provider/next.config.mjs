import { withNextVideo } from 'next-video/process';
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default async function config() {
  return withNextVideo(nextConfig);
}

// Amazon S3 example
// export default withNextVideo(nextConfig, {
//   provider: 'amazon-s3',
//   providerConfig: {
//     'amazon-s3': {
//       endpoint: 'https://s3.us-east-1.amazonaws.com',
//     }
//   },
// });
