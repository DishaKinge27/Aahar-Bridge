import { Link } from 'react-router-dom';
import {
  Building2,
  Check,
  HandHeart,
  PhoneCall,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { buttonClasses } from '../components/ui/Button';
import type { TranslationKey } from '../translations';

interface MissionCard {
  icon: LucideIcon;
  titleKey: TranslationKey;
  textKey: TranslationKey;
}

const MISSION_CARDS: MissionCard[] = [
  { icon: Building2, titleKey: 'home.forProvidersTitle', textKey: 'home.forProvidersText' },
  { icon: Users, titleKey: 'home.forNgosTitle', textKey: 'home.forNgosText' },
  { icon: PhoneCall, titleKey: 'home.coordTitle', textKey: 'home.coordText' },
];

interface Step {
  titleKey: TranslationKey;
  textKey: TranslationKey;
}

const STEPS: Step[] = [
  { titleKey: 'home.step1Title', textKey: 'home.step1Text' },
  { titleKey: 'home.step2Title', textKey: 'home.step2Text' },
  { titleKey: 'home.step3Title', textKey: 'home.step3Text' },
  { titleKey: 'home.step4Title', textKey: 'home.step4Text' },
];

const PROVIDER_POINTS: TranslationKey[] = ['home.p1', 'home.p2', 'home.p3', 'home.p4'];
const NGO_POINTS: TranslationKey[] = ['home.n1', 'home.n2', 'home.n3', 'home.n4'];

export function Home() {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero — deep green band from the reference */}
      <section className="bg-green-800">
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:py-32">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-green-100 sm:text-xl">
            {t('home.heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/post"
              className={buttonClasses({ variant: 'white', size: 'lg', className: 'w-full sm:w-auto' })}
            >
              <HandHeart className="size-5" aria-hidden="true" />
              {t('home.donateFood')}
            </Link>
            <Link
              to="/browse"
              className={buttonClasses({ size: 'lg', className: 'w-full sm:w-auto' })}
            >
              <Search className="size-5" aria-hidden="true" />
              {t('home.findFood')}
            </Link>
          </div>
        </div>
      </section>

      {/* Mission — from the reference */}
      <section className="bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
              {t('home.missionEyebrow')}
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
              {t('home.missionTitle')}
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {MISSION_CARDS.map((card) => (
              <div
                key={card.titleKey}
                className="rounded-2xl bg-slate-50 p-8 text-center dark:bg-slate-900"
              >
                <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                  <card.icon
                    className="size-8 text-green-600 dark:text-green-400"
                    aria-hidden="true"
                  />
                </span>
                <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-slate-50">
                  {t(card.titleKey)}
                </h3>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
                  {t(card.textKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
              {t('home.howEyebrow')}
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {t('home.howTitle')}
            </h2>
          </div>

          <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li
                key={step.titleKey}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-green-600 text-base font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-50">
                  {t(step.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {t(step.textKey)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* For providers / for NGOs */}
      <section className="bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
              {t('home.audienceEyebrow')}
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {t('home.audienceTitle')}
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-8 dark:border-green-900 dark:bg-green-950/40">
              <span className="flex size-12 items-center justify-center rounded-xl bg-green-600 text-white">
                <Building2 className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-2xl font-bold text-slate-900 dark:text-slate-50">
                {t('home.providersPanelTitle')}
              </h3>
              <ul className="mt-5 space-y-3">
                {PROVIDER_POINTS.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-[15px] text-slate-700 dark:text-slate-300"
                  >
                    <Check className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden="true" />
                    {t(point)}
                  </li>
                ))}
              </ul>
              <Link
                to="/register?role=provider"
                className={buttonClasses({ size: 'lg', className: 'mt-7' })}
              >
                {t('home.providersCta')}
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900">
              <span className="flex size-12 items-center justify-center rounded-xl bg-green-600 text-white">
                <Users className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-2xl font-bold text-slate-900 dark:text-slate-50">
                {t('home.ngosPanelTitle')}
              </h3>
              <ul className="mt-5 space-y-3">
                {NGO_POINTS.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-[15px] text-slate-700 dark:text-slate-300"
                  >
                    <Check className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden="true" />
                    {t(point)}
                  </li>
                ))}
              </ul>
              <Link
                to="/register?role=ngo"
                className={buttonClasses({ variant: 'outline', size: 'lg', className: 'mt-7' })}
              >
                {t('home.ngosCta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-green-800">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t('home.ctaTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-green-100">
            {t('home.ctaText')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className={buttonClasses({ variant: 'white', size: 'lg', className: 'w-full sm:w-auto' })}
            >
              {t('home.ctaPrimary')}
            </Link>
            <Link
              to="/browse"
              className={buttonClasses({ size: 'lg', className: 'w-full sm:w-auto' })}
            >
              <Search className="size-5" aria-hidden="true" />
              {t('home.ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
