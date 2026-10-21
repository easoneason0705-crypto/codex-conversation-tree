import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeThemePreference, resolveTheme, themeSource } from '../src/theme.mjs';

test('automatic theme prefers the Codex host over the operating system', () => {
  assert.equal(resolveTheme({preference:'auto',hostTheme:'light',systemDark:true}),'light');
  assert.equal(resolveTheme({preference:'auto',hostTheme:'dark',systemDark:false}),'dark');
  assert.equal(themeSource({preference:'auto',hostTheme:'dark'}),'host');
});

test('automatic theme falls back to the operating system when the host omits it', () => {
  assert.equal(resolveTheme({preference:'auto',systemDark:true}),'dark');
  assert.equal(resolveTheme({preference:'auto',systemDark:false}),'light');
  assert.equal(themeSource({preference:'auto'}),'system');
});

test('manual selection overrides both host and operating system themes', () => {
  assert.equal(resolveTheme({preference:'light',hostTheme:'dark',systemDark:true}),'light');
  assert.equal(resolveTheme({preference:'dark',hostTheme:'light',systemDark:false}),'dark');
  assert.equal(themeSource({preference:'light',hostTheme:'dark'}),'manual');
});

test('unknown persisted values safely return to automatic mode', () => {
  assert.equal(normalizeThemePreference('sepia'),'auto');
  assert.equal(normalizeThemePreference(null),'auto');
});
