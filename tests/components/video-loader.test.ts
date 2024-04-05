import assert from 'node:assert';
import { test, mock } from 'node:test';
import { defaultLoader, createVideoRequest } from '../../src/components/video-loader.js';

test('createVideoRequest', async () => {

  mock.method(global, 'fetch', () => {
    return { ok: true, status: 200, json: async () => ({ status: 'ready' }) };
  });

  const loader = ({ config, src, width, height }: any) => {
    config.path = 'https://example.com/api/video';
    return defaultLoader({ config, src, width, height });
  };

  const props = { src: 'https://example.com/video.mp4' };
  const callback = (json) => {
    assert.equal(json.status, 'ready');
  };

  const request = createVideoRequest(loader, props, callback);
  await request(new AbortController().signal);

  mock.reset();
});
