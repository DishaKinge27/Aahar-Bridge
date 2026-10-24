import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, MapPin, Send, Soup, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Alert } from '../components/ui/Alert';
import { Button, buttonClasses } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { SetupNotice } from '../components/ui/SetupNotice';
import { createListing, uploadFoodImage } from '../lib/api/listings';
import type { TranslationKey } from '../translations';
import { errorMessageKey } from '../utils/errors';
import { datetimeLocalToIso, isoToDatetimeLocal } from '../utils/format';
import {
  hasErrors,
  validateImageFile,
  validatePostFood,
  type FieldErrors,
  type PostFoodValues,
} from '../utils/validators';

const EMPTY_VALUES: PostFoodValues = {
  title: '',
  quantity: '',
  dietType: '',
  address: '',
  deadline: '',
  details: '',
};

export function PostFood() {
  const { t } = useLanguage();
  const { session, configMissing } = useAuth();

  const [values, setValues] = useState<PostFoodValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors<PostFoodValues>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<TranslationKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const update = <K extends keyof PostFoodValues>(key: K, value: PostFoodValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  // Revoke object URLs so previews don't leak memory.
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoChange = (file: File | null) => {
    const invalidKey = file ? validateImageFile(file) : null;
    if (invalidKey) {
      setPhotoError(invalidKey);
      if (photoInputRef.current) photoInputRef.current.value = '';
      return;
    }
    setPhotoError(null);
    setPhoto(file);
    setPhotoPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoError(null);
    setPhotoPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validatePostFood(values);
    setErrors(validation);
    if (hasErrors(validation) || photoError) return;
    const dietType = values.dietType;
    if (!dietType) return;

    const userId = session?.user.id;
    if (!userId) return;

    setFormError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (photo) {
        imageUrl = await uploadFoodImage(userId, photo);
      }
      await createListing(userId, {
        title: values.title.trim(),
        quantity: Number(values.quantity),
        diet_type: dietType,
        address: values.address.trim(),
        deadline: datetimeLocalToIso(values.deadline),
        details: values.details.trim() ? values.details.trim() : null,
        image_url: imageUrl,
      });
      setSuccess(true);
      setValues(EMPTY_VALUES);
      clearPhoto();
    } catch (error) {
      setFormError(t(errorMessageKey(error)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 bg-green-600 px-6 py-5 sm:px-8 sm:py-6">
          <Soup className="size-7 shrink-0 text-white" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-white">{t('post.title')}</h1>
        </div>

        <div className="p-6 sm:p-8">
          {configMissing ? (
            <SetupNotice />
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {success ? (
                <Alert variant="success" onDismiss={() => setSuccess(false)}>
                  {t('post.success')}{' '}
                  <Link
                    to="/dashboard"
                    className="font-semibold underline underline-offset-2"
                  >
                    {t('post.successView')}
                  </Link>
                </Alert>
              ) : null}
              {formError ? (
                <Alert variant="error" onDismiss={() => setFormError(null)}>
                  {formError}
                </Alert>
              ) : null}

              <Field
                label={t('post.foodTitle')}
                htmlFor="post-title"
                required
                error={errors.title ? t(errors.title) : undefined}
              >
                <Input
                  id="post-title"
                  value={values.title}
                  invalid={Boolean(errors.title)}
                  placeholder="Dal, Rice & Chapati"
                  onChange={(event) => update('title', event.target.value)}
                />
              </Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label={t('post.quantity')}
                  htmlFor="post-quantity"
                  required
                  error={errors.quantity ? t(errors.quantity) : undefined}
                >
                  <Input
                    id="post-quantity"
                    type="number"
                    min={1}
                    max={100000}
                    step={1}
                    inputMode="numeric"
                    value={values.quantity}
                    invalid={Boolean(errors.quantity)}
                    onChange={(event) => update('quantity', event.target.value)}
                  />
                </Field>

                <Field
                  label={t('post.dietType')}
                  htmlFor="post-diet"
                  required
                  error={errors.dietType ? t(errors.dietType) : undefined}
                >
                  <Select
                    id="post-diet"
                    value={values.dietType}
                    invalid={Boolean(errors.dietType)}
                    onChange={(event) =>
                      update('dietType', event.target.value as PostFoodValues['dietType'])
                    }
                  >
                    <option value="">{t('post.selectPlaceholder')}</option>
                    <option value="vegetarian">{t('diet.vegetarian')}</option>
                    <option value="non_vegetarian">{t('diet.non_vegetarian')}</option>
                    <option value="mixed">{t('diet.mixed')}</option>
                  </Select>
                </Field>
              </div>

              <Field
                label={t('post.photo')}
                htmlFor="post-photo"
                hint={t('post.photoHint')}
                error={photoError ? t(photoError) : undefined}
              >
                <div className="flex flex-wrap items-center gap-4">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={t('post.photo')}
                      className="h-24 w-24 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                    />
                  ) : (
                    <span className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800">
                      <ImagePlus className="size-7 text-slate-400" aria-hidden="true" />
                    </span>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <label
                      htmlFor="post-photo"
                      className={buttonClasses({ variant: 'outline', className: 'cursor-pointer' })}
                    >
                      <ImagePlus className="size-4" aria-hidden="true" />
                      {photo ? t('post.photoReplace') : t('post.photoChoose')}
                      <input
                        ref={photoInputRef}
                        id="post-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        onChange={(event) =>
                          handlePhotoChange(event.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                    {photo ? (
                      <Button
                        variant="danger"
                        icon={<Trash2 className="size-4" aria-hidden="true" />}
                        onClick={clearPhoto}
                      >
                        {t('post.photoRemove')}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Field>

              <Field
                label={t('post.pickupAddress')}
                htmlFor="post-address"
                required
                error={errors.address ? t(errors.address) : undefined}
              >
                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    id="post-address"
                    value={values.address}
                    invalid={Boolean(errors.address)}
                    className="pl-11"
                    placeholder={t('post.addressPlaceholder')}
                    onChange={(event) => update('address', event.target.value)}
                  />
                </div>
              </Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label={t('post.deadline')}
                  htmlFor="post-deadline"
                  required
                  hint={t('post.deadlineHint')}
                  error={errors.deadline ? t(errors.deadline) : undefined}
                >
                  <Input
                    id="post-deadline"
                    type="datetime-local"
                    min={isoToDatetimeLocal(new Date().toISOString())}
                    value={values.deadline}
                    invalid={Boolean(errors.deadline)}
                    onChange={(event) => update('deadline', event.target.value)}
                  />
                </Field>
              </div>

              <Field
                label={t('post.details')}
                htmlFor="post-details"
                hint={t('common.optional')}
                error={errors.details ? t(errors.details) : undefined}
              >
                <Textarea
                  id="post-details"
                  rows={4}
                  maxLength={1000}
                  value={values.details}
                  invalid={Boolean(errors.details)}
                  placeholder={t('post.detailsPlaceholder')}
                  onChange={(event) => update('details', event.target.value)}
                />
              </Field>

              <div className="flex justify-end border-t border-slate-200 pt-6 dark:border-slate-700">
                <Button
                  type="submit"
                  size="lg"
                  loading={submitting}
                  icon={<Send className="size-5" aria-hidden="true" />}
                >
                  {submitting ? t('post.submitting') : t('post.submit')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
