import assert from 'node:assert';
import { test } from 'node:test';
import { create } from 'react-test-renderer';
import React from 'react';
import Video from '../../src/components/video.js';

test('renders a video container', () => {
  const wrapper = create(<Video />);
  assert.equal(wrapper.toJSON().type, 'div');
  assert.equal(wrapper.toJSON().props.className, 'next-video-container');
});

test('prepends a class to the video container', () => {
  const wrapper = create(<Video className="foo" />);
  assert.equal(wrapper.toJSON().props.className, 'foo next-video-container');
});
