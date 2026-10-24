import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Clock,
  MapPin,
  Phone,
  Scale,
  Send,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Alert } from '../components/ui/Alert';
import { Button, buttonClasses } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Spinner } from '../components/ui/Spinner';
import { Textarea } from '../components/ui/Textarea';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { ListingImage } from '../components/listings/ListingImage';
import { fetchListingById } from '../lib/api/listings';
import { createDonationRequest, fetchMyRequestForListing } from '../lib/api/requests';
import type { DonationRequest, FoodListing, ListingStatus } from '../types';
import type { TranslationKey } from '../translations';
import { errorMessageKey } from '../utils/errors';
import { formatDateTime, isExpired } from '../utils/format';
import { validateMessage } from '../utils/validators';
import { cn } from '../utils/cn';

const DIET_LABEL: Record<string, TranslationKey> = {
  vegetarian: 'diet.vegetarian',
  non_vegetarian: 'diet.non_vegetarian',
  mixed: 'diet.mixed',
};

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

const REQUEST_LABEL: Record<DonationRequest['status'], TranslationKey> = {
  pending: 'details.requestPending',
  accepted: 'details.requestAccepted',
  rejected: 'details.requestRejected',
};

export function DonationDetails() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const { session, profile, configMissing } = useAuth();

  const [listing, setListing] = useState<FoodListing | null>(null);
  const [myRequest, setMyRequest] = useState<DonationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState<TranslationKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formErrorKey, setFormErrorKey] = useState<TranslationKey | null>(null);

  const ngoId = profile?.role === 'ngo' ? profile.id : null;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorKey(null);
    try {
      const row = await fetchListingById(id);
      if (!row) {
        setErrorKey('details.notFoundTitle');
      } else {
        setListing(row);
        if (ngoId) {
          setMyRequest(await fetchMyRequestForListing(id, ngoId));
        }
      }
    } catch (error) {
      setErrorKey(errorMessageKey(error));
    } finally {
      setLoading(false);
    }
  }, [id, ngoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = validateMessage(message);
    if (invalid) {
      setMessageError(invalid);
      return;
    }
    if (!listing || !ngoId) return;

    setMessageError(null);
    setFormErrorKey(null);
    setSubmitting(true);
    try {
      const created = await createDonationRequest(
        listing.id,
        ngoId,
        message.trim() ? message.trim() : null,
      );
      setMyRequest(created);
      setSuccess(true);
      setMessage('');
    } catch (error) {
      setFormErrorKey(errorMessageKey(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-8" label={t('common.loading')} />
      </div>
    );
  }

  if (configMissing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="p-6 text-center text-sm text-slate-600 dark:text-slate-400">
          {t('setup.title')}
        </Card>
      </div>
    );
  }

  if (errorKey || !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <UtensilsCrossed className="mx-auto size-12 text-slate-300" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {errorKey && errorKey !== 'details.notFoundTitle'
            ? t('browse.errorTitle')
            : t('details.notFoundTitle')}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {errorKey && errorKey !== 'details.notFoundTitle'
            ? t(errorKey)
            : t('details.notFoundText')}
        </p>
        <Link to="/browse" className={buttonClasses({ className: 'mt-6' })}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('details.backToBrowse')}
        </Link>
      </div>
    );
  }

  const expired = listing.status === 'available' && isExpired(listing.deadline);
  const isOwner = profile?.id === listing.provider_id;
  const canRequest =
    !isOwner && ngoId !== null && listing.status === 'available' && !expired;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Link
        to="/browse"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-green-700 dark:text-slate-300 dark:hover:text-green-400"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('details.backToBrowse')}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <ListingImage src={listing.image_url} alt={listing.title} className="h-64 w-full sm:h-80" />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONE[listing.status]}>
                  {expired ? t('status.expired') : t(STATUS_LABEL[listing.status])}
                </Badge>
                <Badge tone={listing.diet_type === 'vegetarian' ? 'green' : listing.diet_type === 'mixed' ? 'amber' : 'red'}>
                  {t(DIET_LABEL[listing.diet_type] ?? 'diet.mixed')}
                </Badge>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {listing.title}
              </h1>

              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <Scale className="size-5 shrink-0 text-green-600" aria-hidden="true" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('post.quantity')}
                    </dt>
                    <dd className="font-semibold text-slate-900 dark:text-slate-100">
                      {t('browse.servings').replace('{n}', String(listing.quantity))}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <Clock className="size-5 shrink-0 text-green-600" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('post.deadline')}
                    </dt>
                    <dd
                      className={cn(
                        'truncate font-semibold text-slate-900 dark:text-slate-100',
                        expired && 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {formatDateTime(listing.deadline, lang)}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <MapPin className="size-5 shrink-0 text-green-600" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('post.pickupAddress')}
                    </dt>
                    <dd className="truncate font-semibold text-slate-900 dark:text-slate-100">
                      {listing.address}
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t('details.aboutTitle')}
                </h2>
                <p className="mt-2 leading-7 text-slate-600 dark:text-slate-400">
                  {listing.details?.trim() || t('post.detailsPlaceholder')}
                </p>
              </div>
            </div>
          </Card>

          {/* Request panel */}
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('details.requestTitle')}
            </h2>

            {isOwner ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {t('browse.yours')} —{' '}
                <Link to="/dashboard" className="font-semibold text-green-700 dark:text-green-400">
                  {t('browse.manage')}
                </Link>
              </p>
            ) : myRequest ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={myRequest.status === 'accepted' ? 'green' : myRequest.status === 'pending' ? 'amber' : 'red'}>
                    {t(REQUEST_LABEL[myRequest.status])}
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDateTime(myRequest.created_at, lang)}
                  </span>
                </div>
                {myRequest.message ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    {myRequest.message}
                  </p>
                ) : null}
                <Link
                  to="/dashboard"
                  className={buttonClasses({ variant: 'soft', className: 'mt-1' })}
                >
                  {t('req.myRequests')}
                </Link>
              </div>
            ) : !session ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('details.loginToRequest')}
                </p>
                <Link
                  to="/login"
                  state={{ from: { pathname: `/donations/${listing.id}` } }}
                  className={buttonClasses({})}
                >
                  {t('nav.login')}
                </Link>
              </div>
            ) : !canRequest ? (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
                {expired ? t('details.deadlinePassed') : t('error.noLongerAvailable')}
              </p>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
                {success ? (
                  <Alert variant="success" onDismiss={() => setSuccess(false)}>
                    {t('details.requestSuccess')}
                  </Alert>
                ) : null}
                {formErrorKey ? (
                  <Alert variant="error" onDismiss={() => setFormErrorKey(null)}>
                    {t(formErrorKey)}
                  </Alert>
                ) : null}

                <Field
                  label={t('details.requestMessageLabel')}
                  htmlFor="request-message"
                  hint={t('common.optional')}
                  error={messageError ? t(messageError) : undefined}
                >
                  <Textarea
                    id="request-message"
                    rows={4}
                    maxLength={2000}
                    value={message}
                    invalid={Boolean(messageError)}
                    placeholder={t('details.requestMessagePlaceholder')}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      setMessageError(null);
                    }}
                  />
                </Field>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    loading={submitting}
                    icon={<Send className="size-5" aria-hidden="true" />}
                  >
                    {submitting ? t('details.requestSending') : t('details.requestSubmit')}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('details.providerInfo')}
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300">
                <Building2 className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                  {listing.provider_name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('role.provider')}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {t('details.contactProvider')}
            </p>
            {listing.provider_phone ? (
              <a
                href={`tel:${listing.provider_phone}`}
                className={buttonClasses({ size: 'lg', className: 'mt-4 w-full' })}
              >
                <Phone className="size-5" aria-hidden="true" />
                {listing.provider_phone}
              </a>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t('msg.noPhone')}</p>
            )}
          </Card>

          <Card className="p-6">
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">{t('post.dietType')}</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">
                  {t(DIET_LABEL[listing.diet_type] ?? 'diet.mixed')}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">{t('post.quantity')}</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">
                  {t('browse.servings').replace('{n}', String(listing.quantity))}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">{t('role.provider')}</dt>
                <dd className="truncate font-semibold text-slate-900 dark:text-slate-100">
                  {listing.provider_name}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
