import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { buttonClasses } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../utils/cn';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

export function Navbar() {
  const { t, lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const navItems: NavItem[] = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/post', label: t('nav.postFood') },
    { to: '/browse', label: t('nav.browseFood') },
    { to: '/messages', label: t('nav.messages') },
  ];

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [userMenuOpen]);

  const displayName = profile?.org_name || profile?.full_name || '';
  const roleLabel = profile?.role === 'provider' ? t('role.provider') : t('role.ngo');

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const languageLabel = lang === 'en' ? 'मराठी' : 'EN';

  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t('nav.toggleTheme')}
      title={t('nav.toggleTheme')}
      className="flex size-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      {theme === 'dark' ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </button>
  );

  const languageButton = (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t('nav.toggleLanguage')}
      title={t('nav.toggleLanguage')}
      className="rounded-lg bg-green-100 px-3.5 py-2 text-sm font-bold text-green-800 transition hover:bg-green-200 dark:bg-green-900/60 dark:text-green-300 dark:hover:bg-green-900"
    >
      {languageLabel}
    </button>
  );

  const loginButton = (
    <Link to="/login" className={buttonClasses({ shape: 'pill', size: 'md' })}>
      {t('nav.login')}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="Aahar Bridge">
          <span className="flex size-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
            <Leaf className="size-6 text-green-700 dark:text-green-400" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight text-green-900 sm:text-2xl dark:text-green-400">
            Aahar Bridge
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 text-[17px] font-medium transition',
                  isActive
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-slate-700 hover:text-green-600 dark:text-slate-200 dark:hover:text-green-400',
                )
              }
            >
              {item.to === '/messages' ? (
                <MessageCircle className="size-5" aria-hidden="true" />
              ) : null}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <span className="h-6 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
          {themeButton}
          {languageButton}
          {session ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Avatar name={displayName || t('role.ngo')} size="sm" className="size-9 text-xs" />
                <span className="max-w-[120px] truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {displayName}
                </span>
              </button>
              {userMenuOpen ? (
                <>
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-panel dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <LayoutDashboard className="size-4" aria-hidden="true" />
                      {t('nav.dashboard')}
                    </Link>
                    <Link
                      to="/profile"
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <User className="size-4" aria-hidden="true" />
                      {t('nav.profile')}
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <Link to="/register" className={buttonClasses({ variant: 'soft', shape: 'pill' })}>
              {t('nav.register')}
            </Link>
          )}
          {session ? null : loginButton}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 lg:hidden">
          {themeButton}
          {languageButton}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.menu')}
            aria-expanded={mobileOpen}
            className="flex size-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {mobileOpen ? (
              <X className="size-6" aria-hidden="true" />
            ) : (
              <Menu className="size-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen ? (
        <nav
          aria-label="Mobile"
          className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 dark:border-slate-800 dark:bg-slate-950 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium',
                    isActive
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
                  )
                }
              >
                {item.to === '/messages' ? (
                  <MessageCircle className="size-5" aria-hidden="true" />
                ) : null}
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            {session ? (
              <>
                <Link
                  to="/dashboard"
                  className={buttonClasses({ variant: 'outline', className: 'w-full' })}
                >
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  {t('nav.dashboard')}
                </Link>
                <Link
                  to="/profile"
                  className={buttonClasses({ variant: 'outline', className: 'w-full' })}
                >
                  <User className="size-4" aria-hidden="true" />
                  {t('nav.profile')}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={buttonClasses({ variant: 'danger', className: 'w-full' })}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={buttonClasses({ variant: 'outline', className: 'w-full' })}
                >
                  {t('nav.login')}
                </Link>
                <Link to="/register" className={buttonClasses({ className: 'w-full' })}>
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
