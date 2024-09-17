import assert from 'node:assert';
import { after, describe, it } from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';

import updateNextConfigFile from '../../../src/cli/lib/next-config.js';

function outputConfigName(configName: string) {
  if (configName.endsWith('.mjs')) {
    return 'next.config.mjs';
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
});
