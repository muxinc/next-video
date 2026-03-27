import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, it, before, after } from 'node:test';

import log from '../../../src/utils/logger.js';
import { createDemoPage, detectRoutingType } from '../../../src/utils/cli-utils/create-demo-page.js';

const silenceLog =
  () =>
  (_type: string, ..._messages: string[]) => {};

function logSpies(ctx: any) {
  return {
    infoSpy: ctx.mock.method(log, 'info', silenceLog()),
    warningSpy: ctx.mock.method(log, 'warning', silenceLog()),
    successSpy: ctx.mock.method(log, 'success', silenceLog()),
  };
}

describe('create-demo-page', () => {
  let tmpDir: string;
  let originalCwd: string;

  before(() => {
    originalCwd = process.cwd();
  });

  after(() => {
    process.chdir(originalCwd);
  });

  async function setupTempDir(): Promise<string> {
    const dir = await fs.mkdtemp(path.join(originalCwd, 'tests', 'tmp-demo-'));
    tmpDir = dir;
    process.chdir(dir);
    return dir;
  }

  async function cleanupTempDir() {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }

  describe('detectRoutingType', () => {
    it('should detect app router when app directory exists', async () => {
      await setupTempDir();
      try {
        await fs.mkdir('app', { recursive: true });
        const result = await detectRoutingType();
        assert.equal(result.type, 'app');
        assert.equal(result.basePath, '.');
      } finally {
        await cleanupTempDir();
      }
    });

    it('should detect pages router when pages directory exists', async () => {
      await setupTempDir();
      try {
        await fs.mkdir('pages', { recursive: true });
        const result = await detectRoutingType();
        assert.equal(result.type, 'pages');
        assert.equal(result.basePath, '.');
      } finally {
        await cleanupTempDir();
      }
    });

    it('should detect app router inside src directory', async () => {
      await setupTempDir();
      try {
        await fs.mkdir(path.join('src', 'app'), { recursive: true });
        const result = await detectRoutingType();
        assert.equal(result.type, 'app');
        assert.equal(result.basePath, 'src');
      } finally {
        await cleanupTempDir();
      }
    });

    it('should detect pages router inside src directory', async () => {
      await setupTempDir();
      try {
        await fs.mkdir(path.join('src', 'pages'), { recursive: true });
        const result = await detectRoutingType();
        assert.equal(result.type, 'pages');
        assert.equal(result.basePath, 'src');
      } finally {
        await cleanupTempDir();
      }
    });

    it('should prefer app over pages when both exist', async () => {
      await setupTempDir();
      try {
        await fs.mkdir('app', { recursive: true });
        await fs.mkdir('pages', { recursive: true });
        const result = await detectRoutingType();
        assert.equal(result.type, 'app');
      } finally {
        await cleanupTempDir();
      }
    });

    it('should return unknown when no routing structure exists', async () => {
      await setupTempDir();
      try {
        const result = await detectRoutingType();
        assert.equal(result.type, 'unknown');
      } finally {
        await cleanupTempDir();
      }
    });
  });

  describe('createDemoPage', () => {
    it('should create page.tsx in app/demo-video for app router', async (t) => {
      logSpies(t);
      await setupTempDir();
      try {
        await fs.mkdir('app', { recursive: true });

        const result = await createDemoPage();

        assert.equal(result.success, true);
        assert.equal(result.route, '/demo-video');

        const content = await fs.readFile(path.join('app', 'demo-video', 'page.tsx'), 'utf-8');
        assert(content.includes("import Video from 'next-video'"));
        assert(content.includes('/videos/sample-video.mp4'));
      } finally {
        await cleanupTempDir();
      }
    });

    it('should create demo-video.tsx in pages for pages router', async (t) => {
      logSpies(t);
      await setupTempDir();
      try {
        await fs.mkdir('pages', { recursive: true });

        const result = await createDemoPage();

        assert.equal(result.success, true);
        assert.equal(result.route, '/demo-video');

        const content = await fs.readFile(path.join('pages', 'demo-video.tsx'), 'utf-8');
        assert(content.includes("import Video from 'next-video'"));
      } finally {
        await cleanupTempDir();
      }
    });

    it('should use custom videoImportPrefix when provided', async (t) => {
      logSpies(t);
      await setupTempDir();
      try {
        await fs.mkdir('app', { recursive: true });

        await createDemoPage({ videoImportPrefix: '@videos' });

        const content = await fs.readFile(path.join('app', 'demo-video', 'page.tsx'), 'utf-8');
        assert(content.includes('@videos/sample-video.mp4'));
        assert(!content.includes('/videos/sample-video.mp4'));
      } finally {
        await cleanupTempDir();
      }
    });

    it('should default to /videos prefix when no option provided', async (t) => {
      logSpies(t);
      await setupTempDir();
      try {
        await fs.mkdir('app', { recursive: true });

        await createDemoPage();

        const content = await fs.readFile(path.join('app', 'demo-video', 'page.tsx'), 'utf-8');
        assert(content.includes('/videos/sample-video.mp4'));
      } finally {
        await cleanupTempDir();
      }
    });

    it('should create in src/app when src directory exists', async (t) => {
      logSpies(t);
      await setupTempDir();
      try {
        await fs.mkdir(path.join('src', 'app'), { recursive: true });

        const result = await createDemoPage();

        assert.equal(result.success, true);
        assert.equal(result.route, '/demo-video');

        const content = await fs.readFile(path.join('src', 'app', 'demo-video', 'page.tsx'), 'utf-8');
        assert(content.includes("import Video from 'next-video'"));
      } finally {
        await cleanupTempDir();
      }
    });

    it('should create DemoVideo.tsx in components for unknown routing', async (t) => {
      logSpies(t);
      await setupTempDir();
      try {
        const result = await createDemoPage();

        assert.equal(result.success, true);
        assert.equal(result.route, 'component');

        const content = await fs.readFile(path.join('components', 'DemoVideo.tsx'), 'utf-8');
        assert(content.includes("import Video from 'next-video'"));
      } finally {
        await cleanupTempDir();
      }
    });
  });
});
