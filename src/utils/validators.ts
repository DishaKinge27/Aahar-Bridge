import type { DietType, LanguageCode, Role } from '../types';
import type { TranslationKey } from '../translations';
import { datetimeLocalToIso, isExpired } from './format';

export type FieldErrors<V> = Partial<Record<keyof V, TranslationKey>>;

export interface LoginValues {
  email: string;
  password: string;
}

export interface RegisterValues {
  role: Role;
  fullName: string;
  orgName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PostFoodValues {
  title: string;
  quantity: string;
  dietType: '' | DietType;
  address: string;
  deadline: string;
  details: string;
}

export interface ProfileValues {
  fullName: string;
  orgName: string;
  phone: string;
  address: string;
  language: LanguageCode;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s\-()]{7,15}$/;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateLogin(values: LoginValues): FieldErrors<LoginValues> {
  const errors: FieldErrors<LoginValues> = {};
  if (!values.email.trim()) {
    errors.email = 'validation.required';
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'validation.emailInvalid';
  }
  if (!values.password) {
    errors.password = 'validation.required';
  }
  return errors;
}

export function validateRegister(values: RegisterValues): FieldErrors<RegisterValues> {
  const errors: FieldErrors<RegisterValues> = {};
  if (!values.fullName.trim()) {
    errors.fullName = 'validation.required';
  }
  if (!values.orgName.trim() && values.role === 'ngo') {
    errors.orgName = 'validation.required';
  }
  if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) {
    errors.phone = 'validation.phoneInvalid';
  }
  if (values.role === 'provider' && !values.phone.trim()) {
    errors.phone = 'validation.required';
  }
  if (!values.email.trim()) {
    errors.email = 'validation.required';
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'validation.emailInvalid';
  }
  if (!values.password) {
    errors.password = 'validation.required';
  } else if (values.password.length < 8) {
    errors.password = 'validation.passwordShort';
  }
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'validation.passwordMismatch';
  }
  return errors;
}

export function validatePostFood(values: PostFoodValues): FieldErrors<PostFoodValues> {
  const errors: FieldErrors<PostFoodValues> = {};
  if (!values.title.trim()) {
    errors.title = 'validation.required';
  } else if (values.title.trim().length < 3) {
    errors.title = 'validation.titleShort';
  }

  const quantity = Number(values.quantity);
  if (!values.quantity.trim()) {
    errors.quantity = 'validation.required';
  } else if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
    errors.quantity = 'validation.quantityInvalid';
  }

  if (!values.dietType) {
    errors.dietType = 'validation.required';
  }

  if (!values.address.trim()) {
    errors.address = 'validation.required';
  } else if (values.address.trim().length < 5) {
    errors.address = 'validation.addressShort';
  }

  if (!values.deadline) {
    errors.deadline = 'validation.required';
  } else {
    const iso = datetimeLocalToIso(values.deadline);
    if (!iso || isExpired(iso)) {
      errors.deadline = 'validation.deadlineFuture';
    }
  }

  if (values.details.length > 1000) {
    errors.details = 'validation.detailsLong';
  }
  return errors;
}

/** Returns a translation key when the selected file is invalid, otherwise null. */
export function validateImageFile(file: File | null): TranslationKey | null {
  if (!file) return null;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'validation.imageType';
  if (file.size > MAX_IMAGE_BYTES) return 'validation.imageSize';
  return null;
}

export function validateProfile(values: ProfileValues): FieldErrors<ProfileValues> {
  const errors: FieldErrors<ProfileValues> = {};
  if (!values.fullName.trim()) {
    errors.fullName = 'validation.required';
  }
  if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) {
    errors.phone = 'validation.phoneInvalid';
  }
  return errors;
}

export function validateMessage(body: string): TranslationKey | null {
  const trimmed = body.trim();
  if (!trimmed) return 'validation.required';
  if (trimmed.length > 2000) return 'validation.messageLong';
  return null;
}

export function hasErrors<V>(errors: FieldErrors<V>): boolean {
  return Object.keys(errors).length > 0;
}
