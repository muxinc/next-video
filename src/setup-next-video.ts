import { setVideoConfig } from './config.js';
import handler, { GET, POST } from './request-handler.js';
import { withNextVideo as withNextVideoInternal } from './with-next-video.js';
import type { VideoConfig } from './config.js';
import type { NextConfig } from 'next';

export function NextVideo(config?: VideoConfig) {
  setVideoConfig(config);

  const withNextVideo = (nextConfig: NextConfig) => {
    return withNextVideoInternal(nextConfig, config);
  };

  return {
    GET,
    POST,
    handler,
    withNextVideo,
  };
}
