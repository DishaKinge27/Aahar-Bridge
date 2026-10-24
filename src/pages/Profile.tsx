import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Save, Sun, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { SetupNotice } from '../components/ui/SetupNotice';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { updateProfile } from '../lib/api/profiles';
import type { LanguageCode } from '../types';
import { errorMessageKey } from '../utils/errors';
import { formatDateTime } from '../utils/format';
import {
  hasErrors,
  validateProfile,
  type FieldErrors,
  type ProfileValues,
} from '../utils/validators';
import { cn } from '../utils/cn';

export function Profile() {
  const { t, lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { session, profile, loading, configMissing, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<ProfileValues>({
    fullName: '',
    orgName: '',
    phone: '',
    address: '',
    language: 'en',
  });
  const [errors, setErrors] = useState<FieldErrors<ProfileValues>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setValues({
        fullName: profile.full_name ?? '',
        orgName: profile.org_name ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
        language: profile.language,
      });
    }
  }, [profile]);

  const update = <K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaved(false);
  };

  const applyLanguage = async (next: LanguageCode) => {
    setLang(next);
    update('language', next);
    if (!profile || !session) return;
    try {
      await updateProfile(session.user.id, { language: next });
      await refreshProfile();
    } catch (error) {
      setFormError(t(errorMessageKey(error)));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateProfile(values);
    setErrors(validation);
    if (hasErrors(validation) || !session) return;

    setFormError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateProfile(session.user.id, {
        full_name: values.fullName.trim(),
        org_name: values.orgName.trim() || null,
        phone: values.phone.trim() || null,
        address: values.address.trim() || null,
        language: values.language,
      });
      await refreshProfile();
      setSaved(true);
    } catch (error) {
      setFormError(t(errorMessageKey(error)));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (configMissing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <SetupNotice />
      </div>
    );
  }

  if (loading || !profile || !session) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-8" label={t('common.loading')} />
      </div>
    );
  }

  const roleLabel = profile.role === 'provider' ? t('role.provider') : t('role.ngo');

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
          <UserCog className="size-6 text-green-700 dark:text-green-400" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('profile.title')}
        </h1>
      </div>

      <div className="mt-8 space-y-6">
        {/* Account */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('profile.account')}
            </h2>
            <Badge tone={profile.role === 'provider' ? 'green' : 'blue'}>{roleLabel}</Badge>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">{t('profile.email')}</dt>
              <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                {session.user.email}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">{t('profile.memberSince')}</dt>
              <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                {formatDateTime(profile.created_at, lang)}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Organization details */}
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('profile.org')}
          </h2>

          {saved ? (
            <Alert variant="success" className="mt-4" onDismiss={() => setSaved(false)}>
              {t('profile.saved')}
            </Alert>
          ) : null}
          {formError ? (
            <Alert variant="error" className="mt-4" onDismiss={() => setFormError(null)}>
              {formError}
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t('profile.fullName')}
                htmlFor="profile-name"
                required
                error={errors.fullName ? t(errors.fullName) : undefined}
              >
                <Input
                  id="profile-name"
                  autoComplete="name"
                  value={values.fullName}
                  invalid={Boolean(errors.fullName)}
                  onChange={(event) => update('fullName', event.target.value)}
                />
              </Field>
              <Field
                label={t('profile.orgName')}
                htmlFor="profile-org"
                error={errors.orgName ? t(errors.orgName) : undefined}
              >
                <Input
                  id="profile-org"
                  value={values.orgName}
                  invalid={Boolean(errors.orgName)}
                  onChange={(event) => update('orgName', event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t('profile.phone')}
                htmlFor="profile-phone"
                error={errors.phone ? t(errors.phone) : undefined}
              >
                <Input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  value={values.phone}
                  invalid={Boolean(errors.phone)}
                  onChange={(event) => update('phone', event.target.value)}
                />
              </Field>
              <Field
                label={t('profile.address')}
                htmlFor="profile-address"
                error={errors.address ? t(errors.address) : undefined}
              >
                <Input
                  id="profile-address"
                  value={values.address}
                  invalid={Boolean(errors.address)}
                  onChange={(event) => update('address', event.target.value)}
                />
              </Field>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={saving}
                icon={<Save className="size-4" aria-hidden="true" />}
              >
                {saving ? t('profile.saving') : t('profile.saveChanges')}
              </Button>
            </div>
          </form>
        </Card>

        {/* Preferences */}
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('profile.preferences')}
          </h2>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('profile.languageLabel')}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t('profile.languageDesc')}
              </p>
              <div className="mt-3 inline-flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
                {(['en', 'mr'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => void applyLanguage(code)}
                    aria-pressed={lang === code}
                    className={cn(
                      'rounded-md px-4 py-1.5 text-sm font-semibold transition',
                      lang === code
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    )}
                  >
                    {code === 'en' ? 'English' : 'मराठी'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('profile.themeLabel')}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t('profile.themeDesc')}
              </p>
              <div className="mt-3 inline-flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  aria-pressed={theme === 'light'}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold transition',
                    theme === 'light'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                  )}
                >
                  <Sun className="size-4" aria-hidden="true" />
                  {t('profile.themeLight')}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  aria-pressed={theme === 'dark'}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold transition',
                    theme === 'dark'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                  )}
                >
                  <Moon className="size-4" aria-hidden="true" />
                  {t('profile.themeDark')}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Session */}
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('profile.session')}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t('profile.logoutDesc')}
          </p>
          <Button
            variant="danger"
            className="mt-4"
            icon={<LogOut className="size-4" aria-hidden="true" />}
            onClick={() => void handleSignOut()}
          >
            {t('profile.logout')}
          </Button>
        </Card>
      </div>
    </div>
  );
}
