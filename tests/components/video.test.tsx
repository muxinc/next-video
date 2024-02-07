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

test('renders mux-player without source', async () => {
  await import('@mux/mux-player-react');
  const wrapper = create(<Video />);
  await setTimeout(50);
  assert.equal(wrapper.toJSON().children[1].type, 'mux-player');
});

test('renders mux-player with imported source', async () => {
  await import('@mux/mux-player-react');
  const wrapper = create(<Video src={asset} />);
  await setTimeout(50);
  assert.equal(wrapper.toJSON().children[1].type, 'mux-player');
  assert.equal(
    wrapper.root.findByType('mux-player').parent.parent.props.playbackId,
    'zNYmqdvJ61gt5uip02zPid01rYIPyyzVRVKQChgSgJlaY'
  );
});
