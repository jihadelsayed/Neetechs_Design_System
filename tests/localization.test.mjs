import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ntFormatCurrency,
  ntFormatDate,
  ntFormatDateRange,
  ntFormatList,
  ntFormatNumber,
  ntFormatRelativeTime,
} from '../dist/localization/index.js';

test('number and currency formatting requires and honors an explicit locale', () => {
  assert.equal(ntFormatNumber(12345.6, 'sv-SE'), '12 345,6');
  assert.match(ntFormatCurrency(-1234.5, 'EUR', 'ar-EG'), /١٬٢٣٤٫٥٠/);
  assert.match(ntFormatCurrency(-1234.5, 'EUR', 'ar-EG'), /-/);
});

test('date, date range, relative time, and list formatting use Intl grammar', () => {
  const start = new Date('2026-07-13T12:00:00Z');
  const end = new Date('2026-07-14T12:00:00Z');
  assert.match(ntFormatDate(start, 'sv-SE', { timeZone: 'UTC', dateStyle: 'long' }), /13 juli 2026/);
  assert.match(ntFormatDateRange(start, end, 'en-GB', { timeZone: 'UTC', dateStyle: 'medium' }), /13/);
  assert.equal(ntFormatRelativeTime(-1, 'day', 'sv-SE'), 'för 1 dag sedan');
  assert.equal(ntFormatList(['A', 'B', 'C'], 'en-GB'), 'A, B and C');
});

test('formatters do not carry a hidden English or Swedish default', () => {
  const english = ntFormatNumber(1234.5, 'en-US');
  const arabic = ntFormatNumber(1234.5, 'ar-EG');
  assert.notEqual(english, arabic);
});
