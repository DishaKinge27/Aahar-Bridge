import type { LanguageCode } from '../types';
import type { TranslationKey } from '../translations';

export type Translate = (key: TranslationKey) => string;

const LOCALES: Record<LanguageCode, string> = {
  en: 'en-IN',
  mr: 'mr-IN',
};

/** Full date + time in the given locale, e.g. "24 Oct 2026, 3:00 pm". */
export function formatDateTime(iso: string, locale: LanguageCode): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALES[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/** Short time for chat bubbles, e.g. "2:15 PM". */
export function formatTime(iso: string, locale: LanguageCode): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALES[locale], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Relative label for chat list timestamps:
 * "Just now" / "5 min ago" / "Yesterday" / date.
 */
export function formatRelativeLabel(
  iso: string,
  now: Date,
  locale: LanguageCode,
  t: Translate,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return t('time.justNow');
  if (minutes < 60) return t('time.minutesAgo').replace('{n}', String(minutes));

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfThatDay) / 86400000);

  if (dayDiff === 0) return formatTime(iso, locale);
  if (dayDiff === 1) return t('time.yesterday');
  if (dayDiff < 7) return formatDateTime(iso, locale);
  return formatDateTime(iso, locale);
}

/** First letters of up to two words, e.g. "Engineering College Mess" -> "EM". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Short display location: first segment of the pickup address. */
export function shortLocation(address: string): string {
  const first = address.split(',')[0]?.trim();
  return first && first.length > 0 ? first : address;
}

/** Whether a listing's collection deadline has passed. */
export function isExpired(deadline: string, now: Date = new Date()): boolean {
  const time = new Date(deadline).getTime();
  if (Number.isNaN(time)) return false;
  return time <= now.getTime();
}

/** `datetime-local` input value -> ISO string. */
export function datetimeLocalToIso(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/** ISO string -> value for a `datetime-local` input (local time, minute precision). */
export function isoToDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
