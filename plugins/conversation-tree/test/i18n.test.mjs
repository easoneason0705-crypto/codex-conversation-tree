import test from 'node:test';
import assert from 'node:assert/strict';
import { missingTranslationKeys, normalizeLocale, SUPPORTED_LOCALES, translate } from '../src/i18n.mjs';

test('supported locale variants normalize to the three install choices', () => {
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('zh-Hans'), 'zh-CN');
  assert.equal(normalizeLocale('zh-Hant'), 'zh-TW');
  assert.equal(normalizeLocale('unknown'), 'zh-TW');
});

test('all interface locales translate keys and interpolate values', () => {
  assert.equal(translate('en', 'mainline'), 'Mainline');
  assert.equal(translate('zh-CN', 'mainline'), '主线');
  assert.equal(translate('zh-TW', 'mainline'), '主線');
  assert.equal(translate('en', 'count', { nodes: 4, branches: 2 }), '4 prompts · 2 branches');
});

test('every supported locale contains every interface string', () => {
  for (const locale of SUPPORTED_LOCALES) assert.deepEqual(missingTranslationKeys(locale), []);
});
