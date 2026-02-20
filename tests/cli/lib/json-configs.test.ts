import assert from 'node:assert';
import { describe, it } from 'node:test';

import { addTSConfigPaths, checkPackageJsonForNextVideo, updateTSConfigFileContent } from '../../../src/cli/lib/json-configs.js';

describe('json-configs', () => {
  describe('updateTSConfigFileContent', () => {
    it('should add video.d.ts to the include array inline', () => {
      const tsContents = `{
  "compilerOptions": {
    "target": "es2015"
  },
  "include": ["src/**/*", "foo.d.ts"]
}`;

      const expected = `{
  "compilerOptions": {
    "target": "es2015"
  },
  "include": ["video.d.ts", "src/**/*", "foo.d.ts"]
}`;

      const actual = updateTSConfigFileContent(tsContents);

      assert.equal(actual, expected);
    });

    it('should add video.d.ts to the include array multiline', () => {
      const tsContents = `{
  "compilerOptions": {
    "target": "es2015"
  },
  "include": [
    "src/**/*",
    "foo.d.ts"
  ]
}`;

      const expected = `{
  "compilerOptions": {
    "target": "es2015"
  },
  "include": [
    "video.d.ts",
    "src/**/*",
    "foo.d.ts"
  ]
}`;

      const actual = updateTSConfigFileContent(tsContents);

      assert.equal(actual, expected);
    });
  });

  describe('addTSConfigPaths', () => {
    it('should add @videos/* path to tsconfig with existing compilerOptions', () => {
      const tsContents = JSON.stringify({
        compilerOptions: {
          target: 'es2015',
        },
        include: ['src/**/*'],
      }, null, 2);

      const result = addTSConfigPaths(tsContents, 'videos');
      const parsed = JSON.parse(result);

      assert.deepStrictEqual(parsed.compilerOptions.paths, {
        '@videos/*': ['./videos/*'],
      });
      assert.equal(parsed.compilerOptions.target, 'es2015');
    });

    it('should add @videos/* path when compilerOptions has existing paths', () => {
      const tsContents = JSON.stringify({
        compilerOptions: {
          paths: {
            '@/*': ['./src/*'],
          },
        },
      }, null, 2);

      const result = addTSConfigPaths(tsContents, 'videos');
      const parsed = JSON.parse(result);

      assert.deepStrictEqual(parsed.compilerOptions.paths, {
        '@/*': ['./src/*'],
        '@videos/*': ['./videos/*'],
      });
    });

    it('should create compilerOptions and paths when missing', () => {
      const tsContents = JSON.stringify({
        include: ['src/**/*'],
      }, null, 2);

      const result = addTSConfigPaths(tsContents, 'videos');
      const parsed = JSON.parse(result);

      assert.deepStrictEqual(parsed.compilerOptions.paths, {
        '@videos/*': ['./videos/*'],
      });
    });

    it('should use the provided videosDir in the path', () => {
      const tsContents = JSON.stringify({ compilerOptions: {} }, null, 2);

      const result = addTSConfigPaths(tsContents, 'my-videos');
      const parsed = JSON.parse(result);

      assert.deepStrictEqual(parsed.compilerOptions.paths['@videos/*'], ['./my-videos/*']);
    });
  });

  describe('checkPackageJsonForNextVideo', () => {
    it('should return true if next-video is in devDependencies', async () => {
      assert.equal(await checkPackageJsonForNextVideo('./tests/factories/package.devDep.json'), true);
    });

    it('should return true if next-video is in dependencies', async () => {
      assert.equal(await checkPackageJsonForNextVideo('./tests/factories/package.dep.json'), true);
    });

    it('should return false if next-video is in neither', async () => {
      assert.equal(await checkPackageJsonForNextVideo('./tests/factories/package.none.json'), false);
    });
  });
});
