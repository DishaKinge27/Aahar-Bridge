import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { SetupNotice } from '../components/ui/SetupNotice';
import type { Role } from '../types';
import { errorMessageKey } from '../utils/errors';
import { hasErrors, validateRegister, type FieldErrors, type RegisterValues } from '../utils/validators';
import { cn } from '../utils/cn';

export function Register() {
  const { t } = useLanguage();
  const { signUp, configMissing } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole: Role = searchParams.get('role') === 'ngo' ? 'ngo' : 'provider';

  const [values, setValues] = useState<RegisterValues>({
    role: initialRole,
    fullName: '',
    orgName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FieldErrors<RegisterValues>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const update = <K extends keyof RegisterValues>(key: K, value: RegisterValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateRegister(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setFormError(null);
    setSubmitting(true);
    const result = await signUp({
      email: values.email.trim(),
      password: values.password,
      role: values.role,
      fullName: values.fullName.trim(),
      orgName: values.orgName.trim(),
      phone: values.phone.trim(),
    });
    setSubmitting(false);

    if (result.error) {
      setFormError(t(errorMessageKey(result.error)));
      return;
    }
    if (result.needsConfirmation) {
      setConfirmationSent(true);
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  const roleCard = (
    role: Role,
    Icon: LucideIcon,
    titleKey: 'auth.providerRole' | 'auth.ngoRole',
    descKey: 'auth.providerRoleDesc' | 'auth.ngoRoleDesc',
  ) => {
    const selected = values.role === role;
    return (
      <label
        key={role}
        className={cn(
          'flex cursor-pointer gap-3 rounded-xl border p-4 transition',
          selected
            ? 'border-green-600 bg-green-50 ring-2 ring-green-600 dark:border-green-500 dark:bg-green-950/40 dark:ring-green-500'
            : 'border-slate-200 hover:border-green-300 dark:border-slate-700 dark:hover:border-green-700',
        )}
      >
        <input
          type="radio"
          name="role"
          value={role}
          checked={selected}
          onChange={() => update('role', role)}
          className="sr-only"
        />
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            selected
              ? 'bg-green-600 text-white'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          )}
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
            {t(titleKey)}
            {selected ? <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" /> : null}
          </span>
          <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">
            {t(descKey)}
          </span>
        </span>
      </label>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 bg-green-600 px-6 py-5 sm:px-8">
          <UserPlus className="size-6 text-white" aria-hidden="true" />
          <h1 className="text-xl font-bold text-white sm:text-2xl">{t('auth.registerTitle')}</h1>
        </div>

        <div className="p-6 sm:p-8">
          {configMissing ? (
            <SetupNotice />
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('auth.registerSubtitle')}
              </p>

              {confirmationSent ? (
                <Alert variant="success" className="mt-4">
                  {t('auth.confirmEmailSent')}{' '}
                  <Link to="/login" className="font-semibold underline underline-offset-2">
                    {t('auth.signInLink')}
                  </Link>
                </Alert>
              ) : null}

              {formError ? (
                <Alert variant="error" className="mt-4" onDismiss={() => setFormError(null)}>
                  {formError}
                </Alert>
              ) : null}

              {!confirmationSent ? (
                <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t('auth.roleLabel')}
                      <span className="ml-0.5" aria-hidden="true">
                        *
                      </span>
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {roleCard('provider', Building2, 'auth.providerRole', 'auth.providerRoleDesc')}
                      {roleCard('ngo', Users, 'auth.ngoRole', 'auth.ngoRoleDesc')}
                    </div>
                  </fieldset>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label={t('auth.fullName')}
                      htmlFor="reg-name"
                      required
                      error={errors.fullName ? t(errors.fullName) : undefined}
                    >
                      <Input
                        id="reg-name"
                        autoComplete="name"
                        value={values.fullName}
                        invalid={Boolean(errors.fullName)}
                        onChange={(event) => update('fullName', event.target.value)}
                      />
                    </Field>

                    <Field
                      label={t('auth.orgName')}
                      htmlFor="reg-org"
                      required={values.role === 'ngo'}
                      hint={values.role === 'ngo' ? t('auth.orgNameHintNgo') : t('auth.orgNameHint')}
                      error={errors.orgName ? t(errors.orgName) : undefined}
                    >
                      <Input
                        id="reg-org"
                        value={values.orgName}
                        invalid={Boolean(errors.orgName)}
                        onChange={(event) => update('orgName', event.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label={t('auth.phone')}
                      htmlFor="reg-phone"
                      required={values.role === 'provider'}
                      hint={t('auth.phoneHint')}
                      error={errors.phone ? t(errors.phone) : undefined}
                    >
                      <Input
                        id="reg-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                        value={values.phone}
                        invalid={Boolean(errors.phone)}
                        onChange={(event) => update('phone', event.target.value)}
                      />
                    </Field>

                    <Field
                      label={t('auth.email')}
                      htmlFor="reg-email"
                      required
                      error={errors.email ? t(errors.email) : undefined}
                    >
                      <Input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        value={values.email}
                        invalid={Boolean(errors.email)}
                        onChange={(event) => update('email', event.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label={t('auth.password')}
                      htmlFor="reg-password"
                      required
                      error={errors.password ? t(errors.password) : undefined}
                    >
                      <div className="relative">
                        <Input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={values.password}
                          invalid={Boolean(errors.password)}
                          className="pr-12"
                          onChange={(event) => update('password', event.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((visible) => !visible)}
                          aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                          className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          {showPassword ? (
                            <EyeOff className="size-5" aria-hidden="true" />
                          ) : (
                            <Eye className="size-5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </Field>

                    <Field
                      label={t('auth.confirmPassword')}
                      htmlFor="reg-confirm"
                      required
                      error={errors.confirmPassword ? t(errors.confirmPassword) : undefined}
                    >
                      <Input
                        id="reg-confirm"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={values.confirmPassword}
                        invalid={Boolean(errors.confirmPassword)}
                        onChange={(event) => update('confirmPassword', event.target.value)}
                      />
                    </Field>
                  </div>

                  <Button type="submit" size="lg" loading={submitting} className="w-full">
                    {submitting ? t('auth.signingUp') : t('auth.signUp')}
                  </Button>
                </form>
              ) : (
                <p className="mt-4">
                  <Link
                    to="/login"
                    className="font-semibold text-green-700 hover:text-green-800 dark:text-green-400"
                  >
                    {t('auth.signInLink')} →
                  </Link>
                </p>
              )}

              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                {t('auth.haveAccount')}{' '}
                <Link
                  to="/login"
                  className="font-semibold text-green-700 hover:text-green-800 dark:text-green-400"
                >
                  {t('auth.signInLink')}
                </Link>
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
