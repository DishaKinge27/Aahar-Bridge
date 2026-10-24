import { Soup } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils/cn';

interface ListingImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

/** Food photograph with a tinted placeholder when there is no image or it fails to load. */
export function ListingImage({ src, alt, className }: ListingImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-green-50 dark:bg-green-900/30',
          className,
        )}
      >
        <Soup className="size-12 text-green-400 dark:text-green-600" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
