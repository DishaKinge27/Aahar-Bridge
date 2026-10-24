import { Link, Navigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Alert } from '../components/ui/Alert';
import { Button, buttonClasses } from '../components/ui/Button';
import { SetupNotice } from '../components/ui/SetupNotice';
import { Spinner } from '../components/ui/Spinner';
import { ProviderDashboard } from '../components/dashboard/ProviderDashboard';
import { NgoDashboard } from '../components/dashboard/NgoDashboard';

export function Dashboard() {
  const { t } = useLanguage();
  const { session, profile, loading, configMissing, refreshProfile } = useAuth();

  if (configMissing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <SetupNotice />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-8" label={t('common.loading')} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Alert
          variant="error"
          title={t('error.pageLoad')}
          onDismiss={undefined}
        >
          <div className="mt-1">{t('error.missingField')}</div>
          <Button className="mt-4" onClick={() => void refreshProfile()}>
            {t('common.retry')}
          </Button>
        </Alert>
      </div>
    );
  }

  const isProvider = profile.role === 'provider';
  const displayName = profile.org_name || profile.full_name || '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {isProvider ? t('dash.providerTitle') : t('dash.ngoTitle')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {t('dash.welcome').replace('{name}', displayName || (isProvider ? t('role.provider') : t('role.ngo')))}
          </p>
        </div>
        {isProvider ? (
          <Link to="/post" className={buttonClasses({ shape: 'pill' })}>
            <Plus className="size-4" aria-hidden="true" />
            {t('nav.postFood')}
          </Link>
        ) : (
          <Link to="/browse" className={buttonClasses({ shape: 'pill' })}>
            <Search className="size-4" aria-hidden="true" />
            {t('dash.browseAll')}
          </Link>
        )}
      </div>

      <div className="mt-8">
        {isProvider ? (
          <ProviderDashboard profile={profile} />
        ) : (
          <NgoDashboard profile={profile} />
        )}
      </div>
    </div>
  );
}
