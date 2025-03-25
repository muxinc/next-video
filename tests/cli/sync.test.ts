import assert from 'node:assert';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { describe, it, before, after, mock } from 'node:test';

import Mux from '@mux/mux-node';
import yargs from 'yargs';
import log from '../../src/utils/logger.js';

import { handler, builder } from '../../src/cli/sync.js';
import { createAsset, updateAsset } from '../../src/assets.js';

import * as fakeMux from '../utils/fake-mux.js';

function findConsoleMessage(consoleSpy: any, regex: RegExp) {
  return consoleSpy.mock.calls.find(({ arguments: messages }) => {
    return messages.join('').match(regex);
  });
}

async function createFakeVideoFile(dir: string, filename: string = 'video.mp4'): Promise<string> {
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, 'fake video data');

  return filePath;
}

const silenceLog =
  (silence: boolean = true) =>
  (type: string, ...messages: string[]) => {
    if (silence) {
      return;
    }

    console.log(type, ...messages);
  };

// I really hate this, but for whatever reason we're unable to mock the base log function
// so we have to mock each individual method instead.
function logSpies(ctx: any, silence: boolean = true) {
  return {
    infoSpy: ctx.mock.method(log, 'info', silenceLog(silence)),
    warningSpy: ctx.mock.method(log, 'warning', silenceLog(silence)),
    successSpy: ctx.mock.method(log, 'success', silenceLog(silence)),
    errorSpy: ctx.mock.method(log, 'error', silenceLog(silence)),
    addSpy: ctx.mock.method(log, 'add', silenceLog(silence)),
    spaceSpy: ctx.mock.method(log, 'space', silenceLog(silence)),
  };
}

describe('cli', () => {
  let server: http.Server;
  let tmpDirs: string[] = []; // Keep track of temporary directories so we can clean them up.

  async function createTempDir(): Promise<string> {
    // Create a temporary directory and populate it with some files.
    const dir = await fs.mkdtemp('tmp-videos-');
    tmpDirs.push(dir);
    return dir;
  }

  before(() => {
    process.chdir('tests');

    process.env.MUX_TOKEN_ID = 'fake-token-id';
    process.env.MUX_TOKEN_SECRET = 'fake-token-secret';

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

  after(async () => {
    server.close();

    for (const dir of tmpDirs) {
      await fs.rm(dir, { recursive: true, force: true });
    }

    process.chdir('../');
  });

  describe('sync', () => {
    it('logs a warning and bails if the specified `dir` does not exist', async (t) => {
      const { warningSpy } = logSpies(t);

      const args = builder(yargs('')).parseSync();

      await handler(args);

      assert(findConsoleMessage(warningSpy, /Directory does not exist/i), 'Directory does not exist message not found');
    });

    it('processes new assets', async (t) => {
      const dir = await createTempDir();

      await createFakeVideoFile(dir);

      const { addSpy } = logSpies(t);

      const args = builder(yargs(`--dir ${dir}`)).parseSync();

      await handler(args);

      assert(findConsoleMessage(addSpy, /found 1/i), 'Found 1 message not found');
    });

    it('ignores dotfiles', async (t) => {
      const dir = await createTempDir();

      await fs.writeFile(path.join(dir, '.DS_Store'), 'whatever is in .DS_Store, this is it but fake.');

      const { addSpy } = logSpies(t);

      const args = builder(yargs(`--dir ${dir}`)).parseSync();

      await handler(args);

      assert(!findConsoleMessage(addSpy, /found 1/i), 'Found 1 message found');
    });

    it('ignores existing assets', async (t) => {
      await t.test('that are errored', async (t) => {
        const dir = await createTempDir();

        await createAsset(path.join(dir, 'video.mp4'), {});
        await updateAsset(path.join(dir, 'video.mp4'), { status: 'error' });

        const { addSpy, successSpy } = logSpies(t);

        const args = builder(yargs(`--dir ${dir}`)).parseSync();

        await handler(args);

        assert(!findConsoleMessage(addSpy, /found 1/i), 'Found 1 message found');
        assert(!findConsoleMessage(successSpy, /resumed.*1/i), 'Resumed 1 message not found');
      });

      await t.test('that are ready', async (t) => {
        const dir = await createTempDir();

        await createAsset(path.join(dir, 'video.mp4'), {});
        await updateAsset(path.join(dir, 'video.mp4'), { status: 'ready' });

        const { addSpy, successSpy } = logSpies(t);

        const args = builder(yargs(`--dir ${dir}`)).parseSync();

        await handler(args);

        assert(!findConsoleMessage(addSpy, /found 1/i), 'Found 1 message found');
        assert(!findConsoleMessage(successSpy, /resumed.*1/i), 'Resumed 1 message found');
      });
    });

    it('picks back up existing assets', async (t) => {
      await t.test('that are pending', async (t) => {
        const dir = await createTempDir();

        const filePath = await createFakeVideoFile(dir);

        await createAsset(filePath, {});
        await updateAsset(filePath, {
          status: 'pending',
          providerMetadata: {
            mux: { assetId: 'fake-asset-id' },
          },
        });

        const { addSpy, successSpy } = logSpies(t);

        const args = builder(yargs(`--dir ${dir}`)).parseSync();

        await handler(args);

        assert(!findConsoleMessage(addSpy, /1.*unprocessed/), '1 unprocessed message found');
        assert(findConsoleMessage(successSpy, /resumed.*1/i), 'Resumed message not found');
      });

      await t.test('that are uploading', async (t) => {
        const dir = await createTempDir();

        const filePath = await createFakeVideoFile(dir);

        await createAsset(filePath, {});
        await updateAsset(filePath, {
          status: 'uploading',
          providerMetadata: {
            mux: { assetId: 'fake-asset-id' },
          }
        });

        const { addSpy, successSpy } = logSpies(t);

        const args = builder(yargs(`--dir ${dir}`)).parseSync();

        await handler(args);

        assert(!findConsoleMessage(addSpy, /1.*unprocessed/));
        assert(findConsoleMessage(successSpy, /resumed.*1/i), 'Resumed message not found');
      });

      await t.test('that are processing', async (t) => {
        const dir = await createTempDir();

        const filePath = await createFakeVideoFile(dir);

        await createAsset(filePath, {});
        await updateAsset(filePath, {
          status: 'processing',
          providerMetadata: {
            mux: { assetId: 'fake-asset-id' },
          }
        });

        const { addSpy, successSpy } = logSpies(t);

        const args = builder(yargs(`--dir ${dir}`)).parseSync();

        await handler(args);

        assert(!findConsoleMessage(addSpy, /1.*unprocessed/));
        assert(findConsoleMessage(successSpy, /resumed.*1/i), 'Resumed message not found');
      });
    });
  });
});
