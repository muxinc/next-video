import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
import { getVideoConfig } from '../src/config.js';

describe('config', () => {
  before(() => {
    process.chdir('tests');
  });

  after(() => {
    process.chdir('../');
  });

  it('getVideoConfig', async () => {
    // Test that the default config is returned if no next.config.js file is found.
    const videoConfig = await getVideoConfig();
    assert.equal(videoConfig.folder, 'videos');
    assert.equal(videoConfig.path, '/api/video');
    assert.equal(videoConfig.provider, 'mux');
    assert.deepStrictEqual(videoConfig.providerConfig, {});
  });
});
