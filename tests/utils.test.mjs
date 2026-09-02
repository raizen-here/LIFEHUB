import assert from 'node:assert/strict';
import test from 'node:test';
import { deadlineInfo, normalizeItem, safeUrl } from '../js/utils.js';

test('safeUrl accepts HTTP and HTTPS only', () => {
  assert.equal(safeUrl('https://example.com'), 'https://example.com/');
  assert.equal(safeUrl('http://example.com/path'), 'http://example.com/path');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('not a url'), '');
});

test('normalizeItem supplies a stable metadata model', () => {
  const item = normalizeItem({ title: 'Legacy item', category: 'Application', progress: 140 });
  assert.equal(item.progress, 100);
  assert.deepEqual(item.metadata.requirements, []);
  assert.equal(item.status, 'Inbox');
});

test('deadlineInfo uses calendar days and handles missing dates', () => {
  assert.equal(deadlineInfo('').label, 'No deadline');
  assert.equal(deadlineInfo('2000-01-01').tone, 'overdue');
  assert.match(deadlineInfo(new Date(Date.now() + 10 * 86400000).toISOString()).label, /days left/);
});
