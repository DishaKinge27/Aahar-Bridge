import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  MessageCircle,
  Package,
  RotateCw,
  Search,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Alert } from '../ui/Alert';
import { Badge, type BadgeTone } from '../ui/Badge';
import { Button, buttonClasses } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { StatCard } from '../ui/StatCard';
import { ListingImage } from '../listings/ListingImage';
import { fetchBrowseListings } from '../../lib/api/listings';
import { fetchNgoRequests } from '../../lib/api/requests';
import { startConversation } from '../../lib/api/conversations';
import type { FoodListing, Profile, RequestWithListing } from '../../types';
import type { TranslationKey } from '../../translations';
import { errorMessageKey } from '../../utils/errors';
import { formatDateTime, isExpired, shortLocation } from '../../utils/format';

type Notice = { variant: 'success' | 'error'; key: TranslationKey } | null;

const REQUEST_TONE: Record<string, BadgeTone> = {
  pending: 'amber',
  accepted: 'green',
  rejected: 'slate',
};

const REQUEST_LABEL: Record<string, TranslationKey> = {
  pending: 'req.status.pending',
  accepted: 'req.status.accepted',
  rejected: 'req.status.rejected',
};

export function NgoDashboard({ profile }: { profile: Profile }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<RequestWithListing[]>([]);
  const [available, setAvailable] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [chatBusyId, setChatBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorKey(null);
    try {
      const [requestRows, listingRows] = await Promise.all([
        fetchNgoRequests(profile.id),
        fetchBrowseListings(),
      ]);
      setRequests(requestRows);
      setAvailable(
        listingRows.filter((row) => row.status === 'available' && !isExpired(row.deadline)),
      );
    } catch (error) {
      setErrorKey(errorMessageKey(error));
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingCount = requests.filter((row) => row.status === 'pending').length;
  const acceptedCount = requests.filter((row) => row.status === 'accepted').length;
  const recent = requests.slice(0, 5);

  const openChat = async (listingId: string) => {
    setChatBusyId(listingId);
    setNotice(null);
    try {
      const conversation = await startConversation(listingId);
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      setNotice({ variant: 'error', key: errorMessageKey(error) });
    } finally {
      setChatBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (errorKey) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/50">
        <p className="font-semibold text-red-800 dark:text-red-300">{t('error.pageLoad')}</p>
        <p className="mt-1 text-sm text-red-700 dark:text-red-400">{t(errorKey)}</p>
        <Button
          variant="danger"
          className="mt-4"
          icon={<RotateCw className="size-4" aria-hidden="true" />}
          onClick={() => void load()}
        >
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {notice ? (
        <Alert
          variant={notice.variant}
          onDismiss={() => setNotice(null)}
          dismissLabel={t('common.close')}
        >
          {t(notice.key)}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Package}
          label={t('dash.statAvailableDonations')}
          value={available.length}
        />
        <StatCard icon={ClipboardList} label={t('dash.statSubmitted')} value={requests.length} />
        <StatCard icon={Clock} label={t('dash.statPending')} value={pendingCount} tone="amber" />
        <StatCard
          icon={CheckCircle2}
          label={t('dash.statAccepted')}
          value={acceptedCount}
          tone="blue"
        />
      </div>

      {/* My requests */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('req.myRequests')}
          </h2>
          <Link to="/browse" className={buttonClasses({ variant: 'soft', size: 'sm' })}>
            {t('dash.browseAll')}
          </Link>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={t('req.myRequestsEmpty')}
            action={
              <Link to="/browse" className={buttonClasses({})}>
                {t('dash.browseAll')}
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <ListingImage
                  src={request.listing?.image_url ?? null}
                  alt={request.listing?.title ?? ''}
                  className="size-16 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/donations/${request.listing_id}`}
                      className="font-bold text-slate-900 hover:text-green-700 dark:text-slate-100 dark:hover:text-green-400"
                    >
                      {request.listing?.title ?? t('req.viewListing')}
                    </Link>
                    <Badge tone={REQUEST_TONE[request.status] ?? 'slate'}>
                      {t(REQUEST_LABEL[request.status] ?? 'req.status.pending')}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {request.listing?.provider_name ? `${request.listing.provider_name} · ` : ''}
                    {formatDateTime(request.created_at, lang)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:shrink-0">
                  {request.status !== 'rejected' ? (
                    <Button
                      variant="soft"
                      size="sm"
                      loading={chatBusyId === request.listing_id}
                      icon={<MessageCircle className="size-4" aria-hidden="true" />}
                      onClick={() => void openChat(request.listing_id)}
                    >
                      {t('browse.chat')}
                    </Button>
                  ) : null}
                  <Link
                    to={`/donations/${request.listing_id}`}
                    className={buttonClasses({ variant: 'outline', size: 'sm' })}
                  >
                    <Eye className="size-4" aria-hidden="true" />
                    {t('req.viewListing')}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Available now */}
        <Card>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('dash.availableNow')}
            </h2>
            <Link to="/browse" className={buttonClasses({ variant: 'soft', size: 'sm' })}>
              <Search className="size-4" aria-hidden="true" />
              {t('dash.browseAll')}
            </Link>
          </div>
          {available.length === 0 ? (
            <EmptyState icon={Package} title={t('dash.availableEmpty')} />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {available.slice(0, 6).map((listing) => (
                <li key={listing.id}>
                  <Link
                    to={`/donations/${listing.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <ListingImage
                      src={listing.image_url}
                      alt={listing.title}
                      className="size-12 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                        {listing.title}
                      </p>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                        {t('browse.servings').replace('{n}', String(listing.quantity))} ·{' '}
                        {shortLocation(listing.address)}
                      </p>
                    </div>
                    <Badge tone="green">{t('status.available')}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent activity */}
        <Card>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('dash.recentActivity')}
            </h2>
            <Activity className="size-5 text-green-600" aria-hidden="true" />
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={Activity} title={t('dash.recentEmpty')} />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((request) => (
                <li key={request.id} className="flex items-start gap-3 px-5 py-4">
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full bg-green-500"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {t('req.viewListing')}: {request.listing?.title ?? '—'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime(request.created_at, lang)} ·{' '}
                      {t(REQUEST_LABEL[request.status] ?? 'req.status.pending')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
