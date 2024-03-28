import assert from 'node:assert';
import { test } from 'node:test';
import React from 'react';
import { isReactComponent, getUrlExtension } from '../../src/components/utils.js';

test('isReactComponent', () => {
  assert.ok(isReactComponent(() => null), 'function component');
  assert.ok(isReactComponent(class extends React.Component {}), 'class component');
  assert.ok(isReactComponent(React.memo(() => null)), 'memo');
  assert.ok(isReactComponent(React.forwardRef(() => null)), 'forwardRef');
});

test('getUrlExtension', () => {
  assert.strictEqual(getUrlExtension('https://example.com/image.jpg'), 'jpg');
  assert.strictEqual(getUrlExtension('https://example.com/image.jpg?foo=bar'), 'jpg');
  assert.strictEqual(getUrlExtension('https://example.com/image.jpg#foo'), 'jpg');
  assert.strictEqual(getUrlExtension('https://example.com/image.jpg?foo=bar#foo'), 'jpg');
  assert.strictEqual(getUrlExtension('https://example.com/image.jpg?foo=bar&baz=qux'), 'jpg');
  assert.strictEqual(getUrlExtension('https://example.com/image.jpg?foo=bar&baz=qux#foo'), 'jpg');
  assert.strictEqual(getUrlExtension('https://example.com/image.jpg#foo?foo=bar&baz=qux'), 'jpg');
  assert.strictEqual(getUrlExtension('https://example.com/image.jpg#foo?foo=bar&baz=qux#foo'), 'jpg');
  assert.strictEqual(getUrlExtension('https://example.com/image.jpg?foo=bar&baz=qux#foo?foo=bar&baz=qux'), 'jpg');
  assert.strictEqual(getUrlExtension('https://example.com/image.jpg?foo=bar&baz=qux#foo?foo=bar&baz=qux#foo'), 'jpg');
});
