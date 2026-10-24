import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  Inbox,
  MessageCircle,
  Package,
  RotateCw,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Alert } from '../ui/Alert';
import { Avatar } from '../ui/Avatar';
import { Badge, type BadgeTone } from '../ui/Badge';
import { Button, buttonClasses } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { StatCard } from '../ui/StatCard';
import { ListingImage } from '../listings/ListingImage';
import {
  cancelReservation,
  fetchListingsByProvider,
  updateListingStatus,
} from '../../lib/api/listings';
import { acceptRequest, fetchProviderRequests, rejectRequest } from '../../lib/api/requests';
import { fetchProfilesByIds } from '../../lib/api/profiles';
import { startConversation } from '../../lib/api/conversations';
import type { FoodListing, ListingStatus, Profile, ProfileBrief, RequestWithListing } from '../../types';
import type { TranslationKey } from '../../translations';
import { errorMessageKey } from '../../utils/errors';
import { formatDateTime, isExpired } from '../../utils/format';
import { cn } from '../../utils/cn';

type Notice = { variant: 'success' | 'error'; key: TranslationKey } | null;
type RequestAction = { id: string; kind: 'accept' | 'reject' } | null;

const STATUS_LABEL: Record<ListingStatus, TranslationKey> = {
  available: 'status.available',
  reserved: 'status.reserved',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
};

const STATUS_TONE: Record<ListingStatus, BadgeTone> = {
  available: 'green',
  reserved: 'amber',
  completed: 'slate',
  cancelled: 'red',
};

const REQUEST_TONE: Record<string, BadgeTone> = {
  pending: 'amber',
  accepted: 'green',
  rejected: 'slate',
};

export function ProviderDashboard({ profile }: { profile: Profile }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [listings, setListings] = useState<FoodListing[]>([]);
  const [requests, setRequests] = useState<RequestWithListing[]>([]);
  const [ngoProfiles, setNgoProfiles] = useState<Map<string, ProfileBrief>>(new Map());
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [requestAction, setRequestAction] = useState<RequestAction>(null);
  const [listingBusyId, setListingBusyId] = useState<string | null>(null);
  const [chatBusy, setChatBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorKey(null);
    try {
      const [listingRows, requestRows] = await Promise.all([
        fetchListingsByProvider(profile.id),
        fetchProviderRequests(profile.id),
      ]);
      setListings(listingRows);
      setRequests(requestRows);
      const profiles = await fetchProfilesByIds(requestRows.map((row) => row.ngo_id)).catch(
        () => [] as ProfileBrief[],
      );
      setNgoProfiles(new Map(profiles.map((entry) => [entry.id, entry])));
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
  const availableCount = listings.filter(
    (row) => row.status === 'available' && !isExpired(row.deadline),
  ).length;

  const sortedRequests = [...requests].sort((a, b) => {
    const rank = (status: string) => (status === 'pending' ? 0 : status === 'accepted' ? 1 : 2);
    const diff = rank(a.status) - rank(b.status);
    if (diff !== 0) return diff;
    return b.created_at.localeCompare(a.created_at);
  });

  const handleRespond = async (requestId: string, kind: 'accept' | 'reject') => {
    setRequestAction({ id: requestId, kind });
    setNotice(null);
    try {
      if (kind === 'accept') {
        await acceptRequest(requestId);
        setNotice({ variant: 'success', key: 'req.acceptedMsg' });
      } else {
        await rejectRequest(requestId);
        setNotice({ variant: 'success', key: 'req.rejectedMsg' });
      }
      await load();
    } catch (error) {
      setNotice({ variant: 'error', key: errorMessageKey(error) });
    } finally {
      setRequestAction(null);
    }
  };

  const handleListingAction = async (
    listing: FoodListing,
    action: 'cancel' | ListingStatus,
  ) => {
    setListingBusyId(listing.id);
    setNotice(null);
    try {
      if (action === 'cancel') {
        await cancelReservation(listing.id);
      } else {
        await updateListingStatus(listing.id, action);
      }
      setNotice({ variant: 'success', key: 'dash.listingUpdated' });
      await load();
    } catch (error) {
      setNotice({ variant: 'error', key: errorMessageKey(error) });
    } finally {
      setListingBusyId(null);
    }
  };

  const openChat = async (listingId: string) => {
    setChatBusy(true);
    setNotice(null);
    try {
      const conversation = await startConversation(listingId);
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      setNotice({ variant: 'error', key: errorMessageKey(error) });
    } finally {
      setChatBusy(false);
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
        <StatCard icon={ClipboardList} label={t('dash.statTotalListings')} value={listings.length} />
        <StatCard icon={Package} label={t('dash.statAvailable')} value={availableCount} />
        <StatCard icon={Clock} label={t('dash.statPending')} value={pendingCount} tone="amber" />
        <StatCard
          icon={CheckCircle2}
          label={t('dash.statAccepted')}
          value={acceptedCount}
          tone="blue"
        />
      </div>

      {/* Incoming requests */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('req.incoming')}
          </h2>
          <Badge tone={pendingCount > 0 ? 'amber' : 'slate'}>{pendingCount}</Badge>
        </div>

        {sortedRequests.length === 0 ? (
          <EmptyState icon={Inbox} title={t('req.incomingEmpty')} />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedRequests.map((request) => {
              const ngo = request.ngo_id ? ngoProfiles.get(request.ngo_id) : undefined;
              const ngoName =
                ngo?.org_name || ngo?.full_name || `${t('role.ngo')}`;
              const busyThis = requestAction?.id === request.id;
              return (
                <li key={request.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                  <Avatar name={ngoName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{ngoName}</p>
                      <Badge tone={REQUEST_TONE[request.status] ?? 'slate'}>
                        {t(
                          request.status === 'pending'
                            ? 'req.status.pending'
                            : request.status === 'accepted'
                              ? 'req.status.accepted'
                              : 'req.status.rejected',
                        )}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                      {request.listing?.title ?? t('req.viewListing')} ·{' '}
                      {formatDateTime(request.created_at, lang)}
                    </p>
                    {request.message ? (
                      <p className="mt-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                        {request.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 sm:shrink-0">
                    {request.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          loading={busyThis && requestAction?.kind === 'accept'}
                          disabled={Boolean(requestAction)}
                          icon={<Check className="size-4" aria-hidden="true" />}
                          onClick={() => void handleRespond(request.id, 'accept')}
                        >
                          {busyThis && requestAction?.kind === 'accept'
                            ? t('req.accepting')
                            : t('req.accept')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={busyThis && requestAction?.kind === 'reject'}
                          disabled={Boolean(requestAction)}
                          icon={<X className="size-4" aria-hidden="true" />}
                          onClick={() => void handleRespond(request.id, 'reject')}
                        >
                          {busyThis && requestAction?.kind === 'reject'
                            ? t('req.rejecting')
                            : t('req.reject')}
                        </Button>
                      </>
                    ) : null}

                    {request.status !== 'rejected' && request.listing_id ? (
                      <Button
                        variant="soft"
                        size="sm"
                        loading={chatBusy}
                        icon={<MessageCircle className="size-4" aria-hidden="true" />}
                        onClick={() => void openChat(request.listing_id)}
                      >
                        {t('browse.chat')}
                      </Button>
                    ) : null}

                    {request.listing_id ? (
                      <Link
                        to={`/donations/${request.listing_id}`}
                        className={buttonClasses({ variant: 'outline', size: 'sm' })}
                      >
                        <Eye className="size-4" aria-hidden="true" />
                        {t('req.viewListing')}
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* My listings */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t('dash.myListings')}
          </h2>
          <Link
            to="/post"
            className={buttonClasses({ variant: 'soft', size: 'sm' })}
          >
            {t('dash.postFirst')}
          </Link>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('dash.myListingsEmpty')}
            action={
              <Link to="/post" className={buttonClasses({})}>
                {t('dash.postFirst')}
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {listings.map((listing) => {
              const expired = listing.status === 'available' && isExpired(listing.deadline);
              const busy = listingBusyId === listing.id;
              return (
                <li key={listing.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <ListingImage
                    src={listing.image_url}
                    alt={listing.title}
                    className="size-16 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/donations/${listing.id}`}
                        className="font-bold text-slate-900 hover:text-green-700 dark:text-slate-100 dark:hover:text-green-400"
                      >
                        {listing.title}
                      </Link>
                      <Badge tone={expired ? 'red' : STATUS_TONE[listing.status]}>
                        {expired ? t('status.expired') : t(STATUS_LABEL[listing.status])}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {t('browse.servings').replace('{n}', String(listing.quantity))} ·{' '}
                      {t('browse.collectBy').replace(
                        '{date}',
                        formatDateTime(listing.deadline, lang),
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:shrink-0">
                    {listing.status === 'available' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={busy}
                        onClick={() => void handleListingAction(listing, 'cancelled')}
                      >
                        {t('dash.markUnavailable')}
                      </Button>
                    ) : null}
                    {listing.status === 'reserved' ? (
                      <>
                        <Button
                          size="sm"
                          loading={busy}
                          icon={<Check className="size-4" aria-hidden="true" />}
                          onClick={() => void handleListingAction(listing, 'completed')}
                        >
                          {t('dash.markCollected')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={busy}
                          onClick={() => void handleListingAction(listing, 'cancel')}
                        >
                          {t('dash.cancelReservation')}
                        </Button>
                      </>
                    ) : null}
                    {listing.status === 'cancelled' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={busy}
                        onClick={() => void handleListingAction(listing, 'available')}
                      >
                        {t('dash.makeAvailable')}
                      </Button>
                    ) : null}
                    {listing.status === 'completed' ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                        )}
                      >
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        {t('status.completed')}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
