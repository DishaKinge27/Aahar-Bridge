import { describe, expect, it } from 'vitest';
import { en, mr, translations } from './translations';

describe('translations', () => {
  it('exposes both languages', () => {
    expect(translations.en).toBeDefined();
    expect(translations.mr).toBeDefined();
  });

  it('has identical key sets for English and Marathi', () => {
    const enKeys = Object.keys(en).sort();
    const mrKeys = Object.keys(mr).sort();
    expect(mrKeys).toEqual(enKeys);
  });

  it('has no empty or whitespace-only strings', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim(), `en.${key}`).not.toBe('');
    }
    for (const [key, value] of Object.entries(mr)) {
      expect(value.trim(), `mr.${key}`).not.toBe('');
    }
  });

  it('actually translates the navigation into Marathi', () => {
    expect(mr['nav.home']).toBe('होम');
    expect(mr['nav.login']).toBe('लॉगिन');
    expect(en['nav.home']).toBe('Home');
  });
});
