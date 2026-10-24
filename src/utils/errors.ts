import type { TranslationKey } from '../translations';

interface SupabaseLikeError {
  code?: string;
  message?: string;
}

function asError(value: unknown): SupabaseLikeError | null {
  if (typeof value === 'object' && value !== null && 'message' in value) {
    return value as SupabaseLikeError;
  }
  return null;
}

/**
 * Maps common Supabase/auth failures to a translation key so pages can show
 * localized, understandable messages. Falls back to `error.generic`.
 */
export function errorMessageKey(error: unknown): TranslationKey {
  const err = asError(error);
  if (!err) return 'error.generic';

  const message = (err.message ?? '').toLowerCase();
  const code = err.code ?? '';

  if (code === '23505' || message.includes('duplicate key')) return 'error.duplicateRequest';
  if (code === '42501' || message.includes('row-level security')) return 'error.notAllowed';
  if (message.includes('invalid login credentials')) return 'error.invalidCredentials';
  if (message.includes('email not confirmed')) return 'error.emailNotConfirmed';
  if (code === '23502' || message.includes('null value')) return 'error.missingField';
  if (message.includes('already been resolved') || message.includes('no longer available')) {
    return 'error.noLongerAvailable';
  }
  if (message.includes('no ngo has requested')) return 'error.noRequestYet';
  if (message.includes('failed to fetch') || message.includes('network')) return 'error.network';
  if (message.includes('password should be at least')) return 'validation.passwordShort';
  if (message.includes('already registered')) return 'error.emailExists';
  return 'error.generic';
}

/** Short, safe error message for logs (never includes credentials). */
export function logError(context: string, error: unknown): void {
  // eslint-disable-next-line no-console
  console.error(`[aahar-bridge] ${context}:`, asError(error)?.message ?? error);
}
