import assert from 'node:assert';
import { describe, it } from 'node:test';
import { deepMerge } from '../src/utils/utils.js';

describe('utils', () => {
  it('deepMerge', () => {
    const a = {
      foo: {
        bar: 'baz',
        qux: 'quux',
      },
      beep: 'boop',
      providerMetadata: {
        mux: {
          uploadId: '1',
          assetId: '2',
        }
      }
    };

    const b = {
      foo: {
        bar: 'baz2',
      },
      beep: 'boop2',
      providerMetadata: {
        mux: {
          assetId: '3',
          playbackId: '4',
        }
      }
    };

    const c = deepMerge(a, b);

    assert(c.foo.bar === 'baz2');
    assert(c.foo.qux === 'quux');
    assert(c.beep === 'boop2');
    assert(c.providerMetadata.mux.uploadId === '1');
    assert(c.providerMetadata.mux.assetId === '3');
    assert(c.providerMetadata.mux.playbackId === '4');
  });
});
