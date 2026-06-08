import assert from 'node:assert';
import path from 'node:path';
import { describe, it, before, after } from 'node:test';
import { setVideoConfig } from '../src/config.js';
import { assertSafeAssetSource } from '../src/assets.js';

describe('assertSafeAssetSource', () => {
  const originalCwd = process.cwd();

  before(() => {
    process.chdir('tests');
    setVideoConfig({ folder: 'videos' });
  });

  after(() => {
    process.chdir(originalCwd);
  });

  it('accepts a relative path inside folder', async () => {
    await assert.doesNotReject(() => assertSafeAssetSource('videos/foo.mp4'));
  });

  it('accepts a nested path inside folder', async () => {
    await assert.doesNotReject(() => assertSafeAssetSource('videos/sub/dir/foo.mp4'));
  });

  it('accepts an absolute path inside folder', async () => {
    const abs = path.resolve(process.cwd(), 'videos', 'bar.mp4');
    await assert.doesNotReject(() => assertSafeAssetSource(abs));
  });

  it('accepts an https remote URL (bypasses local containment)', async () => {
    await assert.doesNotReject(() => assertSafeAssetSource('https://example.com/video.mp4'));
  });

  it('accepts uppercase HTTPS:// as remote', async () => {
    await assert.doesNotReject(() => assertSafeAssetSource('HTTPS://example.com/video.mp4'));
  });

  it('rejects a bare filename outside folder', async () => {
    await assert.rejects(
      () => assertSafeAssetSource('package'),
      /outside the configured video folder/
    );
  });

  it('rejects an absolute path outside folder', async () => {
    await assert.rejects(
      () => assertSafeAssetSource('/etc/hosts'),
      /outside the configured video folder/
    );
  });

  it('rejects a relative traversal path', async () => {
    await assert.rejects(
      () => assertSafeAssetSource('../../package'),
      /outside the configured video folder/
    );
  });

  it('rejects a path that traverses through folder back out', async () => {
    await assert.rejects(
      () => assertSafeAssetSource('videos/../package'),
      /outside the configured video folder/
    );
  });

  it('rejects a path that exactly equals folder', async () => {
    await assert.rejects(
      () => assertSafeAssetSource('videos'),
      /outside the configured video folder/
    );
  });

  it('rejects a known .next traversal target', async () => {
    await assert.rejects(
      () => assertSafeAssetSource('.next/server/server-reference-manifest'),
      /outside the configured video folder/
    );
  });
});
