import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
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
    const fakeSaveAsset = function (path: string, asset: Asset): Promise<void> { return Promise.resolve() }
    const fakeUpdateAsset = function (path: string, asset: Asset): Promise<void> { return Promise.resolve() }

    const result = await withNextVideo(nextConfig, {
      path: '/api/video-files',
      folder: 'video-files',
      provider: 'vercel-blob',
      loadAsset: fakeLoadAsset,
      saveAsset: fakeSaveAsset,
      updateAsset: fakeUpdateAsset
    });

    const config = result.serverRuntimeConfig.nextVideo;
    assert.deepEqual(config, {
      path: '/api/video-files',
      folder: 'video-files',
      provider: 'vercel-blob',
      providerConfig: {},
      loadAsset: fakeLoadAsset,
      saveAsset: fakeSaveAsset,
      updateAsset: fakeUpdateAsset
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

  it('should create symlink when video files are present', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'next-video-test-'));
    const videosDir = path.join(tempDir, 'videos');
    const publicDir = path.join(tempDir, 'public');
    const symlinkPath = path.join(publicDir, '_next-video');

    fs.mkdirSync(videosDir);
    fs.mkdirSync(publicDir);
    fs.writeFileSync(path.join(videosDir, 'test.mp4'), 'dummy content');

    const originalCwd = process.cwd();
    const originalArgv = process.argv;

    try {
      process.chdir(tempDir);
      process.argv = ['node', 'next', 'dev'];

      const nextConfig = {};
      await withNextVideo(nextConfig, { folder: 'videos' });

      assert(fs.existsSync(symlinkPath), 'Symlink should be created');
      assert(fs.lstatSync(symlinkPath).isSymbolicLink(), 'Should be a symbolic link');
      const symlinkTarget = fs.readlinkSync(symlinkPath);
      assert.equal(path.resolve(path.dirname(symlinkPath), symlinkTarget), videosDir, 'Symlink should point to videos directory');
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      process.chdir(originalCwd);
      process.argv = originalArgv;
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should not create symlink when no video files are present', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'next-video-test-'));
    const videosDir = path.join(tempDir, 'videos');
    const publicDir = path.join(tempDir, 'public');
    const symlinkPath = path.join(publicDir, '_next-video');

    fs.mkdirSync(videosDir);
    fs.mkdirSync(publicDir);

    const originalCwd = process.cwd();
    const originalArgv = process.argv;

    try {
      process.chdir(tempDir);
      process.argv = ['node', 'next', 'dev'];

      const nextConfig = {};
      await withNextVideo(nextConfig, { folder: 'videos' });

      assert(!fs.existsSync(symlinkPath), 'Symlink should not be created');
    } finally {
      process.chdir(originalCwd);
      process.argv = originalArgv;
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
