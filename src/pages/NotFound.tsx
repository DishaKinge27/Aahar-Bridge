import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { buttonClasses } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        icon={Compass}
        title={t('notFound.title')}
        text={t('notFound.text')}
        action={
          <Link to="/" className={buttonClasses({})}>
            {t('notFound.home')}
          </Link>
        }
      />
    </div>
  );
}
