import { Settings2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from './Card';

/** Shown on pages that need Supabase when env variables are missing. */
export function SetupNotice() {
  const { t } = useLanguage();
  return (
    <Card className="mx-auto mt-10 max-w-xl p-8 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/40">
        <Settings2 className="size-7 text-green-600 dark:text-green-400" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        {t('setup.title')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t('setup.text')}</p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-left text-xs text-green-300">
{`VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`}
      </pre>
    </Card>
  );
}
