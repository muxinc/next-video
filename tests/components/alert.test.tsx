import assert from 'node:assert';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { create } from 'react-test-renderer';
import React from 'react';
import { Alert } from '../../src/components/alert.js';

test('renders an error alert', async () => {
  const wrapper = create(<Alert status="error" hidden={true} />);
  await setTimeout(50);
  const fragment = wrapper.toJSON();
  assert.equal(fragment[1].type, 'div');
  assert.equal(fragment[1].props.className, 'next-video-alert next-video-alert-error');
  assert.equal(fragment[1].props.hidden, true);
});

test('renders a sourced alert', async () => {
  const wrapper = create(<Alert status="sourced" hidden={false} />);
  await setTimeout(50);
  const fragment = wrapper.toJSON();
  assert.equal(fragment[1].type, 'div');
  assert.equal(fragment[1].props.className, 'next-video-alert next-video-alert-sourced');
  assert.equal(fragment[1].props.hidden, false);
});
