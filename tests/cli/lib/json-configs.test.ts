import assert from 'node:assert';
import { describe, it } from 'node:test';

import { updateTSConfigFileContent } from '../../../src/cli/lib/json-configs.js';

describe('tsconfig', () => {
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
});
