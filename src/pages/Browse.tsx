import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, Search, SearchX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SetupNotice } from '../components/ui/SetupNotice';
import { Skeleton } from '../components/ui/Skeleton';
import { Select } from '../components/ui/Select';
import { ListingCard } from '../components/listings/ListingCard';
import { fetchBrowseListings } from '../lib/api/listings';
import { startConversation } from '../lib/api/conversations';
import type { DietType, FoodListing } from '../types';
import type { TranslationKey } from '../translations';
import { errorMessageKey } from '../utils/errors';
import { isExpired } from '../utils/format';

export function Browse() {
  const { t } = useLanguage();
  const { session, profile, configMissing } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [search, setSearch] = useState('');
  const [diet, setDiet] = useState<'' | DietType>('');
  const [chatBusyId, setChatBusyId] = useState<string | null>(null);
  const [chatErrorKey, setChatErrorKey] = useState<TranslationKey | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorKey(null);
    try {
      setListings(await fetchBrowseListings());
    } catch (error) {
      setErrorKey(errorMessageKey(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return listings.filter((listing) => {
      const matchesDiet = diet === '' || listing.diet_type === diet;
      if (!matchesDiet) return false;
      if (!query) return true;
      return [listing.title, listing.address, listing.provider_name].some((field) =>
        field.toLowerCase().includes(query),
      );
    });
  }, [listings, search, diet]);

  const filtersActive = search.trim() !== '' || diet !== '';

  const clearFilters = () => {
    setSearch('');
    setDiet('');
  };

  const handleChat = async (listing: FoodListing) => {
    if (!session) {
      navigate('/login', { state: { from: { pathname: '/browse' } } });
      return;
    }
    setChatBusyId(listing.id);
    setChatErrorKey(null);
    try {
      const conversation = await startConversation(listing.id);
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      setChatErrorKey(errorMessageKey(error));
    } finally {
      setChatBusyId(null);
    }
  };

  const isNgo = profile?.role === 'ngo';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="md:flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t('browse.title')}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">{t('browse.subtitle')}</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:items-center md:justify-end">
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="browse-search" className="sr-only">
              {t('browse.searchPlaceholder')}
            </label>
            <input
              id="browse-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('browse.searchPlaceholder')}
              className="field-control pl-11"
            />
          </div>
          <div className="w-full sm:w-48">
            <label htmlFor="browse-diet" className="sr-only">
              {t('browse.filterDiet')}
            </label>
            <Select
              id="browse-diet"
              value={diet}
              onChange={(event) => setDiet(event.target.value as '' | DietType)}
            >
              <option value="">{t('browse.filterAll')}</option>
              <option value="vegetarian">{t('diet.vegetarian')}</option>
              <option value="non_vegetarian">{t('diet.non_vegetarian')}</option>
              <option value="mixed">{t('diet.mixed')}</option>
            </Select>
          </div>
        </div>
      </div>

      {configMissing ? (
        <SetupNotice />
      ) : chatErrorKey ? (
        <Alert variant="error" className="mt-6" onDismiss={() => setChatErrorKey(null)}>
          {t(chatErrorKey)}
        </Alert>
      ) : null}

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2" aria-label={t('browse.loading')}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <Skeleton className="h-56 w-full rounded-none" />
                <div className="space-y-3 p-6">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex gap-3 pt-2">
                    <Skeleton className="h-11 flex-1" />
                    <Skeleton className="h-11 flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : errorKey ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/50">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-red-800 dark:text-red-300">
                  {t('browse.errorTitle')}
                </h2>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">{t(errorKey)}</p>
              </div>
              <Button
                variant="danger"
                icon={<RotateCw className="size-4" aria-hidden="true" />}
                onClick={() => void load()}
              >
                {t('common.retry')}
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t('browse.emptyTitle')}
            text={t('browse.emptyText')}
            action={
              filtersActive ? (
                <Button variant="outline" onClick={clearFilters}>
                  {t('common.clearFilters')}
                </Button>
              ) : (
                <Button variant="outline" onClick={() => void load()}>
                  {t('common.retry')}
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((listing) => {
              const isOwner = profile?.id === listing.provider_id;
              const expired =
                listing.status === 'available' && isExpired(listing.deadline);
              return (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isOwner={isOwner}
                  showChat={isNgo && !isOwner && !expired}
                  busy={chatBusyId === listing.id}
                  onChat={(selected) => void handleChat(selected)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
