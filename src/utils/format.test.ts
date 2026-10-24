import { describe, expect, it } from 'vitest';
import { en } from '../translations';
import type { TranslationKey } from '../translations';
import {
  datetimeLocalToIso,
  formatDateTime,
  formatRelativeLabel,
  formatTime,
  initials,
  isExpired,
  isoToDatetimeLocal,
  shortLocation,
} from './format';

const t = (key: TranslationKey): string => en[key];

describe('initials', () => {
  it('uses the first two words (matches the reference “EC” avatar)', () => {
    expect(initials('Engineering College Mess')).toBe('EC');
  });
  it('handles single words and empties', () => {
    expect(initials('Hotel')).toBe('HO');
    expect(initials('   ')).toBe('?');
  });
});

describe('shortLocation', () => {
  it('returns the first address segment', () => {
    expect(shortLocation('North Campus, University Road, Pune')).toBe('North Campus');
  });
  it('falls back to the whole address', () => {
    expect(shortLocation('Downtown')).toBe('Downtown');
  });
});

describe('isExpired', () => {
  it('detects past and future deadlines', () => {
    expect(isExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
    expect(isExpired(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });
  it('treats unparseable dates as not expired', () => {
    expect(isExpired('not-a-date')).toBe(false);
  });
});

describe('formatRelativeLabel', () => {
  const now = new Date('2026-10-24T12:00:00');

  it('shows "Just now" within a minute', () => {
    const iso = new Date(now.getTime() - 30_000).toISOString();
    expect(formatRelativeLabel(iso, now, 'en', t)).toBe('Just now');
  });

  it('shows minutes ago', () => {
    const iso = new Date(now.getTime() - 5 * 60_000).toISOString();
    expect(formatRelativeLabel(iso, now, 'en', t)).toBe('5 min ago');
  });

  it('shows "Yesterday" for the previous day', () => {
    const iso = new Date('2026-10-23T18:00:00').toISOString();
    expect(formatRelativeLabel(iso, now, 'en', t)).toBe('Yesterday');
  });
});

describe('date formatting', () => {
  it('formats a valid date and time', () => {
    const out = formatDateTime('2026-10-24T15:00:00.000Z', 'en');
    expect(out).not.toBe('—');
    expect(out).toMatch(/2026/);
  });
  it('returns an em dash for invalid input', () => {
    expect(formatDateTime('nope', 'en')).toBe('—');
    expect(formatTime('nope', 'en')).toBe('—');
  });
});

describe('datetime-local conversions', () => {
  it('round-trips a local datetime value', () => {
    const local = '2026-01-05T14:30';
    const iso = datetimeLocalToIso(local);
    expect(iso).not.toBe('');
    expect(isoToDatetimeLocal(iso)).toBe(local);
  });
  it('returns empty string for invalid input', () => {
    expect(datetimeLocalToIso('garbage')).toBe('');
    expect(isoToDatetimeLocal('garbage')).toBe('');
  });
});
