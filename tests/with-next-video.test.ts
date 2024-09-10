import assert from 'node:assert';
import { describe, it } from 'node:test';

import { withNextVideo } from '../src/with-next-video.js';
import { Asset } from '../src/assets.js';

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

  it('should handle videoConfig being passed', async () => {
    const nextConfig = {};
    const fakeLoadAsset = function (path: string): Promise<Asset | undefined> { return Promise.resolve(undefined) }

    const result = await withNextVideo(nextConfig, {
      path: '/api/video-files',
      folder: 'video-files',
      provider: 'vercel-blob',
      loadAsset: fakeLoadAsset
    });

    const config = result.serverRuntimeConfig.nextVideo;
    assert.deepEqual(config, {
      path: '/api/video-files',
      folder: 'video-files',
      provider: 'vercel-blob',
      providerConfig: {},
      loadAsset: fakeLoadAsset
    });
  });

  it('should change the webpack config', async () => {
    const nextConfig = {};
    const result = await withNextVideo(nextConfig);
    const config = {
      externals: [],
      experiments: {},
      module: {
        rules: [],
      },
    };
    const options = {
      defaultLoaders: true,
    };
    const webpackConfig = result.webpack(config, options);

    assert.equal(webpackConfig.externals[0].sharp, 'commonjs sharp');
    assert.equal(webpackConfig.module.rules.length, 2);
    assert.deepEqual(webpackConfig.infrastructureLogging, { level: 'error' });
  });
});
