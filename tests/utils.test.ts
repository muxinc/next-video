import assert from 'node:assert';
import { describe, it } from 'node:test';
import { deepMerge } from '../src/utils.js';

describe('utils', () => {
  it('deepMerge', () => {
    const a = {
      foo: {
        bar: 'baz',
        qux: 'quux',
      },
      beep: 'boop',
      providerSpecific: {
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
      providerSpecific: {
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
    assert(c.providerSpecific.mux.uploadId === '1');
    assert(c.providerSpecific.mux.assetId === '3');
    assert(c.providerSpecific.mux.playbackId === '4');
  });
});
