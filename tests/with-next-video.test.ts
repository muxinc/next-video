import assert from 'node:assert';
import { describe, it } from 'node:test';

import { withNextVideo } from '../src/with-next-video.js';

describe('withNextVideo', () => {
  it('should handle nextConfig being a function', async () => {
    const nextConfig = (phase, { defaultConfig }) => {
      /**
       * @type {import('next').NextConfig}
       */
      const nextConfig = {
        ...defaultConfig,
      };
      return nextConfig;
    };

    const result = await withNextVideo(nextConfig);

    const configResult = await result('phase', { defaultConfig: {} });

    assert(typeof configResult.webpack === 'function');
  });

  it('should handle nextConfig being a promise', async () => {
    const nextConfig = async (phase, { defaultConfig }) => {
      /**
       * @type {import('next').NextConfig}
       */
      const nextConfig = {
        ...defaultConfig,
      };
      return nextConfig;
    };

    const result = await withNextVideo(nextConfig);

    const configResult = await result('phase', { defaultConfig: {} });

    assert(typeof configResult.webpack === 'function');
  });

  it('should handle nextConfig being an object', async () => {
    const nextConfig = {};

    const result = await withNextVideo(nextConfig);

    assert(typeof result.webpack === 'function');
  });
});
