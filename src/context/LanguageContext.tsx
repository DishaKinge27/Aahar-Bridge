import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { translations, type TranslationKey } from '../translations';
import type { LanguageCode } from '../types';

interface LanguageContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const STORAGE_KEY = 'aahar-bridge-lang';
const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLang(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'mr' ? 'mr' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(getInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = useCallback((next: LanguageCode) => setLangState(next), []);
  const toggleLang = useCallback(
    () => setLangState((current) => (current === 'en' ? 'mr' : 'en')),
    [],
  );
  const t = useCallback(
    (key: TranslationKey) => translations[lang][key] ?? translations.en[key],
    [lang],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
