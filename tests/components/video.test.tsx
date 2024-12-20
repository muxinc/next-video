import assert from 'node:assert';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { create } from 'react-test-renderer';
import React from 'react';
import asset from '../factories/BBB-720p-1min.mp4.json' assert { type: "json" };
import Video from '../../src/components/video.js';

test('renders a video container', async () => {
  const wrapper = create(<Video />);
  await setTimeout(50);
  assert.equal(wrapper.toJSON().type, 'div');
  assert.equal(wrapper.toJSON().props.className, 'next-video-container');
});

test('prepends a class to the video container', async () => {
  const wrapper = create(<Video className="foo" />);
  await setTimeout(50);
  assert.equal(wrapper.toJSON().props.className, 'foo next-video-container');
});

test('renders native video without source', async () => {
  const wrapper = create(<Video controls={false} />);
  await setTimeout(50);
  assert.equal(wrapper.toJSON().children[1].type, 'video');
});

test('renders mux-video without UI with imported source', async () => {
  await import('@mux/mux-video');

  const wrapper = create(<Video controls={false} src={asset} />);
  await setTimeout(400);

  assert.equal(wrapper.toJSON().children[1].type, 'mux-video');
  assert.equal(
    wrapper.root.findByType('mux-video').parent.props.playbackId,
    'zNYmqdvJ61gt5uip02zPid01rYIPyyzVRVKQChgSgJlaY'
  );
});

test('renders media-controller and mux-video', async () => {
  await import('media-chrome');
  await import('@mux/mux-video');

  const wrapper = create(<Video src={asset} />);
  await setTimeout(50);

  assert.equal(wrapper.toJSON().children[1].type, 'media-theme-sutro');
  assert.equal(wrapper.toJSON().children[1].children[1].type, 'mux-video');
  assert.equal(
    wrapper.root.findByType('mux-video').parent.props.playbackId,
    'zNYmqdvJ61gt5uip02zPid01rYIPyyzVRVKQChgSgJlaY'
  );
});

test('renders mux-video with string source', async () => {
  await import('@mux/mux-video');

  process.env.NODE_ENV = 'development';

  let keepalive = globalThis.setTimeout(() => {}, 5_000);

  let resolve;
  const pollReady = new Promise((res) => {
    resolve = res;
  });

  let count = 0;

  const globalFetch = global.fetch;

  // @ts-ignore
  global.fetch = () => {
    return {
      ok: true,
      status: 200,
      json: async () => {
        count++;

        if (count < 2) {
          return {
            status: 'uploading',
            provider: 'mux',
          };
        }

        resolve();

        return {
          status: 'ready',
          provider: 'mux',
          providerMetadata: {
            mux: {
              playbackId: 'jxEf6XiJs6JY017pSzpv8Hd6tTbdAOecHTq4FiFAn564',
            },
          },
          sources: [{
            type: 'application/x-mpegURL',
            src: 'https://stream.mux.com/jxEf6XiJs6JY017pSzpv8Hd6tTbdAOecHTq4FiFAn564.m3u8'
          }]
        };
      }
    };
  };

  const wrapper = create(<Video controls={false} src="https://storage.googleapis.com/muxdemofiles/mux.mp4" />);

  await pollReady;
  await setTimeout(50);

  clearTimeout(keepalive);

  assert.equal(wrapper.toJSON().children[1].type, 'mux-video');
  assert.equal(
    wrapper.root.findByType('mux-video').parent.parent.props.playbackId,
    'jxEf6XiJs6JY017pSzpv8Hd6tTbdAOecHTq4FiFAn564'
  );

  global.fetch = globalFetch;
});
