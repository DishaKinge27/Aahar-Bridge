import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  const platformLinks: Array<{ to: string; label: string }> = [
    { to: '/', label: t('nav.home') },
    { to: '/browse', label: t('nav.browseFood') },
    { to: '/post', label: t('nav.postFood') },
    { to: '/messages', label: t('nav.messages') },
  ];
  const accountLinks: Array<{ to: string; label: string }> = [
    { to: '/login', label: t('nav.login') },
    { to: '/register', label: t('nav.register') },
    { to: '/dashboard', label: t('nav.dashboard') },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
                <Leaf className="size-5 text-green-700 dark:text-green-400" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold text-green-900 dark:text-green-400">
                Aahar Bridge
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
              {t('footer.platform')}
            </h3>
            <ul className="mt-3 space-y-2">
              {platformLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-600 transition hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
              {t('footer.account')}
            </h3>
            <ul className="mt-3 space-y-2">
              {accountLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-600 transition hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {t('footer.copyright')}
        </p>
      </div>
    </footer>
  );
}
