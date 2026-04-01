import assert from 'node:assert';
import { after, describe, it } from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';

import updateNextConfigFile from '../../../src/cli/lib/next-config.js';

function outputConfigName(configName: string) {
  if (configName.endsWith('.mjs')) {
    return 'next.config.mjs';
  }

  if (configName.endsWith('.ts')) {
    return 'next.config.ts';
  }

  // We have to return cjs files so we can import them async in a test.
  return 'next.config.js';
}

describe('updateNextConfig', () => {
  let tmpDirs: string[] = [];

  async function createTempDirWithConfig(configName: string): Promise<string> {
    const dir = await fs.mkdtemp(path.join('tests', 'tmp-configs-'));
    tmpDirs.push(dir);

    const outputName = outputConfigName(configName);
    await fs.copyFile(path.join('tests', 'factories', configName), path.join(dir, outputName));

    return dir;
  }

  after(() => {
    tmpDirs.forEach(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    });
  });

  it('should add next-video to the next.config.js file', async () => {
    const dirPath = await createTempDirWithConfig('next.config.js');
    await updateNextConfigFile(dirPath);

    const updatedContents = await fs.readFile(path.join(dirPath, 'next.config.js'), 'utf-8');

    assert(updatedContents.includes('next-video'));
  });

  it('should add next-video to the next.config.mjs file', async () => {
    const dirPath = await createTempDirWithConfig('next.config.mjs');
    await updateNextConfigFile(dirPath);

    const updatedContents = await fs.readFile(path.join(dirPath, 'next.config.mjs'), 'utf-8');
    assert(updatedContents.includes('next-video'));
  });

  it('should add next-video to the next.config.ts file', async () => {
    const dirPath = await createTempDirWithConfig('next.config.ts');
    await updateNextConfigFile(dirPath);

    const updatedContents = await fs.readFile(path.join(dirPath, 'next.config.ts'), 'utf-8');
    assert(updatedContents.includes('next-video'));
  });

  it('should inject withNextVideo inside existing plugin wrappers', async () => {
    const dir = await fs.mkdtemp(path.join('tests', 'tmp-configs-'));
    tmpDirs.push(dir);
    await fs.copyFile(path.join('tests', 'factories', 'next.wrapped.config.ts'), path.join(dir, 'next.config.ts'));

    await updateNextConfigFile(dir);

    const updatedContents = await fs.readFile(path.join(dir, 'next.config.ts'), 'utf-8');
    // withNextVideo should wrap the base config, not the outer withSentryConfig call
    assert(updatedContents.includes('withSentryConfig(withNextVideo(nextConfig))'));
  });
});
