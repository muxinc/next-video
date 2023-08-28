import assert from 'node:assert';
import { describe, it } from 'node:test';

import { checkPackageJsonForNextVideo, updateTSConfigFileContent } from '../../../src/cli/lib/json-configs.js';

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

  describe('checkPackageJsonForNextVideo', () => {
    it('should return true if next-video is in devDependencies', async () => {
      assert.equal(await checkPackageJsonForNextVideo('./tests/cli/factories/package.devDep.json'), true);
    });

    it('should return true if next-video is in dependencies', async () => {
      assert.equal(await checkPackageJsonForNextVideo('./tests/cli/factories/package.dep.json'), true);
    });

    it('should return false if next-video is in neither', async () => {
      assert.equal(await checkPackageJsonForNextVideo('./tests/cli/factories/package.none.json'), false);
    });
  });
});
