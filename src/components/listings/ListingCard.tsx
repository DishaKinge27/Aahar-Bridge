import { Building2, Clock, MapPin, MessageCircle, Phone, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DietType, FoodListing, ListingStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import type { TranslationKey } from '../../translations';
import { formatDateTime, isExpired, shortLocation } from '../../utils/format';
import { buttonClasses } from '../ui/Button';
import { Badge, type BadgeTone } from '../ui/Badge';
import { ListingImage } from './ListingImage';
import { cn } from '../../utils/cn';

interface ListingCardProps {
  listing: FoodListing;
  isOwner: boolean;
  /** Show the Chat action (only meaningful for NGOs on others' listings). */
  showChat: boolean;
  onChat: (listing: FoodListing) => void;
  busy?: boolean;
}

const DIET_LABEL: Record<DietType, TranslationKey> = {
  vegetarian: 'diet.vegetarian',
  non_vegetarian: 'diet.non_vegetarian',
  mixed: 'diet.mixed',
};

const DIET_TONE: Record<DietType, BadgeTone> = {
  vegetarian: 'green',
  non_vegetarian: 'red',
  mixed: 'amber',
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

/** Browse-grid card: photo + diet/status badges, provider, servings, location, actions. */
export function ListingCard({ listing, isOwner, showChat, onChat, busy = false }: ListingCardProps) {
  const { t, lang } = useLanguage();

  const expired = listing.status === 'available' && isExpired(listing.deadline);
  const statusKey: TranslationKey = expired ? 'status.expired' : STATUS_LABEL[listing.status];
  const statusTone: BadgeTone = expired ? 'red' : STATUS_TONE[listing.status];

  const servings = t('browse.servings').replace('{n}', String(listing.quantity));

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:shadow-panel dark:border-slate-800 dark:bg-slate-900">
      <Link
        to={`/donations/${listing.id}`}
        className="relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        aria-label={listing.title}
      >
        <ListingImage src={listing.image_url} alt={listing.title} className="h-56 w-full" />
        <span className="absolute left-4 top-4">
          <Badge tone={statusTone} className="shadow-sm">
            {t(statusKey)}
          </Badge>
        </span>
        <span className="absolute right-4 top-4">
          <Badge tone={DIET_TONE[listing.diet_type]} className="shadow-sm">
            {t(DIET_LABEL[listing.diet_type])}
          </Badge>
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <Link
          to={`/donations/${listing.id}`}
          className="text-xl font-bold leading-7 text-slate-900 transition hover:text-green-700 dark:text-slate-50 dark:hover:text-green-400"
        >
          {listing.title}
        </Link>

        <p className="mt-2 flex items-center gap-2 text-[15px] font-medium text-green-600 dark:text-green-400">
          <Building2 className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{listing.provider_name}</span>
        </p>

        <dl className="mt-4 space-y-2.5 text-[15px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2.5">
            <Scale className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
            <dd>{servings}</dd>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
            <dd className="truncate">{shortLocation(listing.address)}</dd>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
            <dd className={cn(expired && 'text-red-600 dark:text-red-400')}>
              {t('browse.collectBy').replace('{date}', formatDateTime(listing.deadline, lang))}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-1 items-end gap-3 pt-1">
          {isOwner ? (
            <Link
              to="/dashboard"
              className={buttonClasses({ variant: 'soft', size: 'lg', className: 'flex-1' })}
            >
              {t('browse.manage')}
            </Link>
          ) : showChat ? (
            <>
              <button
                type="button"
                onClick={() => onChat(listing)}
                disabled={busy}
                aria-busy={busy || undefined}
                className={buttonClasses({
                  variant: 'soft',
                  size: 'lg',
                  className: 'flex-1',
                })}
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                {t('browse.chat')}
              </button>
              <CallButton listing={listing} label={t('browse.callProvider')} />
            </>
          ) : (
            <CallButton listing={listing} label={t('browse.callProvider')} className="flex-1" />
          )}
        </div>
      </div>
    </article>
  );
}

function CallButton({
  listing,
  label,
  className,
}: {
  listing: FoodListing;
  label: string;
  className?: string;
}) {
  const { t } = useLanguage();
  if (listing.provider_phone) {
    return (
      <a
        href={`tel:${listing.provider_phone}`}
        className={buttonClasses({ size: 'lg', className: cn('flex-1', className) })}
      >
        <Phone className="size-4" aria-hidden="true" />
        {label}
      </a>
    );
  }
  return (
    <button
      type="button"
      disabled
      title={t('msg.noPhone')}
      className={buttonClasses({ size: 'lg', className: cn('flex-1', className) })}
    >
      <Phone className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
