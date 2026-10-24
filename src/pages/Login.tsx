import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Alert } from '../components/ui/Alert';
import { Button, buttonClasses } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { SetupNotice } from '../components/ui/SetupNotice';
import { errorMessageKey } from '../utils/errors';
import { hasErrors, validateLogin, type FieldErrors, type LoginValues } from '../utils/validators';

interface LocationState {
  from?: { pathname: string };
  confirmed?: boolean;
}

export function Login() {
  const { t } = useLanguage();
  const { signIn, session, configMissing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? null) as LocationState | null;
  const from = state?.from?.pathname;

  // Only redirect when a session existed on first render (not right after sign-in).
  const hadSession = useRef(session !== null);

  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<LoginValues>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedNotice, setConfirmedNotice] = useState<boolean>(Boolean(state?.confirmed));

  if (hadSession.current) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateLogin(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setFormError(null);
    setConfirmedNotice(false);
    setSubmitting(true);
    const result = await signIn(values.email.trim(), values.password);
    setSubmitting(false);

    if (result.error) {
      setFormError(t(errorMessageKey(result.error)));
      return;
    }
    const target = from ?? (result.profile?.role === 'provider' ? '/dashboard' : '/browse');
    navigate(target, { replace: true });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 bg-green-600 px-6 py-5 sm:px-8">
          <LogIn className="size-6 text-white" aria-hidden="true" />
          <h1 className="text-xl font-bold text-white sm:text-2xl">{t('auth.loginTitle')}</h1>
        </div>

        <div className="p-6 sm:p-8">
          {configMissing ? (
            <SetupNotice />
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('auth.loginSubtitle')}
              </p>

              {confirmedNotice ? (
                <Alert variant="success" className="mt-4" onDismiss={() => setConfirmedNotice(false)}>
                  {t('auth.confirmEmailSent')}
                </Alert>
              ) : null}

              {formError ? (
                <Alert variant="error" className="mt-4" onDismiss={() => setFormError(null)}>
                  {formError}
                </Alert>
              ) : null}

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                <Field label={t('auth.email')} htmlFor="login-email" required error={errors.email ? t(errors.email) : undefined}>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={values.email}
                    invalid={Boolean(errors.email)}
                    onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                  />
                </Field>

                <Field
                  label={t('auth.password')}
                  htmlFor="login-password"
                  required
                  error={errors.password ? t(errors.password) : undefined}
                >
                  <div className="relative">
                    <Input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={values.password}
                      invalid={Boolean(errors.password)}
                      className="pr-12"
                      onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
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

                <Button
                  type="submit"
                  size="lg"
                  loading={submitting}
                  className="w-full"
                >
                  {submitting ? t('auth.signingIn') : t('auth.signIn')}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                {t('auth.noAccount')}{' '}
                <Link
                  to="/register"
                  className="font-semibold text-green-700 hover:text-green-800 dark:text-green-400"
                >
                  {t('auth.createAccount')}
                </Link>
              </p>
            </>
          )}
        </div>
      </Card>

      <p className="mt-6 text-center">
        <Link to="/browse" className={buttonClasses({ variant: 'soft', shape: 'pill' })}>
          {t('nav.browseFood')}
        </Link>
      </p>
    </div>
  );
}
