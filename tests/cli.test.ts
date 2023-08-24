import assert from 'node:assert';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { describe, it, before, after, mock } from 'node:test';

import Mux from '@mux/mux-node';
import yargs from 'yargs';

import { handler, builder } from '../src/cli/sync.js';
import { createAsset, updateAsset } from '../src/assets.js';

import * as fakeMux from './utils/fake-mux.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function createTempDir(): Promise<[string, () => Promise<void>]> {
  // Create a temporary directory and populate it with some files.
  const dir = await fs.mkdtemp(path.join('tests', 'tmp-videos-'));

  return [dir, () => fs.rm(dir, { recursive: true, force: true })];
}

async function createFakeVideoFile(dir: string, filename: string = 'video.mp4'): Promise<string> {
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, 'fake video data');

  return filePath;
}

function findConsoleMessage(consoleSpy: any, regex: RegExp) {
  return consoleSpy.mock.calls.find(({ arguments: [_label, message] }) => message.match(regex));
}

// It doesn't feel great to have to mock calls to console instead of the log functions, but this
// seems to be a limitation of the `assert` library for now. https://github.com/orgs/nodejs/discussions/47959

describe('cli', () => {
  let server: http.Server;

  before(() => {
    mock.method(Mux.prototype, 'post', fakeMux.post);
    mock.method(Mux.prototype, 'get', fakeMux.get);

    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });

    server.listen(3123, () => {
      // console.info('Dummy upload server running on http://localhost:3123');
    });
  });

  after(() => {
    server.close();
  });

  describe('sync', () => {
    it('logs a warning and bails if the specified `dir` does not exist', async (t) => {
      const consoleSpy = t.mock.method(console, 'log', () => {});

      const args = builder(yargs('')).parseSync();

      await handler(args);

      assert(findConsoleMessage(consoleSpy, /Directory does not exist/i), 'Directory does not exist message not found');
      assert(
        findConsoleMessage(consoleSpy, /Did you forget to run next-video init/i),
        'Did you forget to run next-video init message not found'
      );
    });

    it('processes new assets', async (t) => {
      const [dir, cleanupTmpDir] = await createTempDir();

      await createFakeVideoFile(dir);

      const consoleSpy = t.mock.method(console, 'log', () => {});

      const args = builder(yargs(`--dir ${dir}`)).parseSync();

      await handler(args);

      assert(findConsoleMessage(consoleSpy, /found 1/i), 'Found 1 message not found');

      await cleanupTmpDir();
    });

    it('ignores existing assets', async (t) => {
      await t.test('that are errored', async (t) => {
        const [dir, cleanupTmpDir] = await createTempDir();

        await createAsset(path.join(dir, 'video.mp4'), {});
        await updateAsset(path.join(dir, 'video.mp4'), { status: 'error' });

        const consoleSpy = t.mock.method(console, 'log', () => {});

        const args = builder(yargs(`--dir ${dir}`)).parseSync();

        await handler(args);

        assert(findConsoleMessage(consoleSpy, /found 0/i), 'Found 0 message not found');
        assert(findConsoleMessage(consoleSpy, /resumed.*0/i), 'Resumed 0 message not found');

        await cleanupTmpDir();
      });

      await t.test('that are ready', async (t) => {
        const [dir, cleanupTmpDir] = await createTempDir();

        await createAsset(path.join(dir, 'video.mp4'), {});
        await updateAsset(path.join(dir, 'video.mp4'), { status: 'ready' });

        const consoleSpy = t.mock.method(console, 'log', () => {});

        const args = builder(yargs(`--dir ${dir}`)).parseSync();

        await handler(args);

        assert(findConsoleMessage(consoleSpy, /found 0/i), 'Found 0 message not found');
        assert(findConsoleMessage(consoleSpy, /resumed.*0/i), 'Resumed 0 message not found');

        await cleanupTmpDir();
      });
    });

    it('picks back up existing assets', async (t) => {
      await t.test('that are pending', async (t) => {
        const [dir, cleanupTmpDir] = await createTempDir();

        const filePath = await createFakeVideoFile(dir);

        await createAsset(filePath, {});
        await updateAsset(filePath, {
          status: 'pending',
          externalIds: { assetId: 'fake-asset-id' },
        });

        const consoleSpy = t.mock.method(console, 'log', () => {});

        const args = builder(yargs(`--dir ${dir}`)).parseSync();

        await handler(args);

        assert(findConsoleMessage(consoleSpy, /0.*unprocessed/), '0 unprocessed message not found');
        assert(findConsoleMessage(consoleSpy, /uploading.*/i), 'Uploading message not found');
        assert(findConsoleMessage(consoleSpy, /uploaded.*/i), 'Uploaded message not found');
        assert(findConsoleMessage(consoleSpy, /processing.*/i), 'Processing message not found');
        assert(findConsoleMessage(consoleSpy, /ready.*/i), 'Ready message not found');
        assert(findConsoleMessage(consoleSpy, /resumed.*1/i), 'Resumed message not found');

        await cleanupTmpDir();
      });

      await t.test('that are uploading', async (t) => {
        const [dir, cleanupTmpDir] = await createTempDir();

        const filePath = await createFakeVideoFile(dir);

        await createAsset(filePath, {});
        await updateAsset(filePath, {
          status: 'uploading',
          externalIds: { assetId: 'fake-asset-id' },
        });

        const consoleSpy = t.mock.method(console, 'log', () => {});

        const args = builder(yargs(`--dir ${dir}`)).parseSync();

        await handler(args);

        assert(findConsoleMessage(consoleSpy, /0.*unprocessed/));
        assert(findConsoleMessage(consoleSpy, /uploading.*/i), 'Uploading message not found');
        assert(findConsoleMessage(consoleSpy, /uploaded.*/i), 'Uploaded message not found');
        assert(findConsoleMessage(consoleSpy, /processing.*/i), 'Processing message not found');
        assert(findConsoleMessage(consoleSpy, /ready.*/i), 'Ready message not found');
        assert(findConsoleMessage(consoleSpy, /resumed.*1/i), 'Resumed message not found');

        await cleanupTmpDir();
      });

      await t.test('that are processing', async (t) => {
        const [dir, cleanupTmpDir] = await createTempDir();

        const filePath = await createFakeVideoFile(dir);

        await createAsset(filePath, {});
        await updateAsset(filePath, {
          status: 'processing',
          externalIds: { assetId: 'fake-asset-id' },
        });

        const consoleSpy = t.mock.method(console, 'log', () => {});

        const args = builder(yargs(`--dir ${dir}`)).parseSync();

        await handler(args);

        assert(findConsoleMessage(consoleSpy, /0.*unprocessed/));
        assert(findConsoleMessage(consoleSpy, /processing.*/i), 'Processing message not found');
        assert(findConsoleMessage(consoleSpy, /ready.*/i), 'Ready message not found');
        assert(findConsoleMessage(consoleSpy, /resumed.*1/i), 'Resumed message not found');

        await cleanupTmpDir();
      });
    });
  });
});
