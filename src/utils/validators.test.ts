import { describe, expect, it } from 'vitest';
import {
  hasErrors,
  validateImageFile,
  validateLogin,
  validatePostFood,
  validateProfile,
  validateRegister,
  validateMessage,
} from './validators';

describe('validateLogin', () => {
  it('requires both fields', () => {
    const errors = validateLogin({ email: '', password: '' });
    expect(errors.email).toBe('validation.required');
    expect(errors.password).toBe('validation.required');
  });

  it('rejects malformed emails', () => {
    const errors = validateLogin({ email: 'not-an-email', password: 'secret' });
    expect(errors.email).toBe('validation.emailInvalid');
    expect(errors.password).toBeUndefined();
  });

  it('accepts valid credentials', () => {
    expect(hasErrors(validateLogin({ email: 'a@b.co', password: 'secret' }))).toBe(false);
  });
});

describe('validateRegister', () => {
  const base = {
    role: 'provider' as const,
    fullName: 'Priya Sharma',
    orgName: 'Green Hotel',
    phone: '+91 98765 43210',
    email: 'priya@example.com',
    password: 'longenough',
    confirmPassword: 'longenough',
  };

  it('accepts a complete provider registration', () => {
    expect(hasErrors(validateRegister(base))).toBe(false);
  });

  it('requires a phone number for providers', () => {
    const errors = validateRegister({ ...base, phone: '' });
    expect(errors.phone).toBe('validation.required');
  });

  it('does not require a phone number for NGOs', () => {
    const errors = validateRegister({ ...base, role: 'ngo', phone: '' });
    expect(errors.phone).toBeUndefined();
  });

  it('requires an organization name for NGOs', () => {
    const errors = validateRegister({ ...base, role: 'ngo', orgName: '' });
    expect(errors.orgName).toBe('validation.required');
  });

  it('flags short passwords and mismatches', () => {
    const errors = validateRegister({ ...base, password: 'short', confirmPassword: 'other' });
    expect(errors.password).toBe('validation.passwordShort');
    expect(errors.confirmPassword).toBe('validation.passwordMismatch');
  });

  it('rejects invalid phone numbers', () => {
    const errors = validateRegister({ ...base, phone: '12' });
    expect(errors.phone).toBe('validation.phoneInvalid');
  });
});

describe('validatePostFood', () => {
  const future = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const futureLocal = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`;

  const valid = {
    title: 'Dal, Rice & Chapati',
    quantity: '40',
    dietType: 'vegetarian' as const,
    address: 'North Campus Mess, University Road',
    deadline: futureLocal,
    details: 'Packed in clean boxes.',
  };

  it('accepts a complete listing', () => {
    expect(hasErrors(validatePostFood(valid))).toBe(false);
  });

  it('requires every mandatory field', () => {
    const errors = validatePostFood({
      title: '',
      quantity: '',
      dietType: '',
      address: '',
      deadline: '',
      details: '',
    });
    expect(errors.title).toBe('validation.required');
    expect(errors.quantity).toBe('validation.required');
    expect(errors.dietType).toBe('validation.required');
    expect(errors.address).toBe('validation.required');
    expect(errors.deadline).toBe('validation.required');
  });

  it('rejects non-integer quantities', () => {
    const errors = validatePostFood({ ...valid, quantity: '2.5' });
    expect(errors.quantity).toBe('validation.quantityInvalid');
    const zero = validatePostFood({ ...valid, quantity: '0' });
    expect(zero.quantity).toBe('validation.quantityInvalid');
  });

  it('rejects deadlines in the past', () => {
    const errors = validatePostFood({ ...valid, deadline: '2020-01-01T10:00' });
    expect(errors.deadline).toBe('validation.deadlineFuture');
  });

  it('rejects overly long details', () => {
    const errors = validatePostFood({ ...valid, details: 'x'.repeat(1001) });
    expect(errors.details).toBe('validation.detailsLong');
  });
});

describe('validateImageFile', () => {
  it('accepts a small PNG', () => {
    const file = new File(['png'], 'food.png', { type: 'image/png' });
    expect(validateImageFile(file)).toBeNull();
  });

  it('rejects disallowed types', () => {
    const file = new File(['x'], 'food.pdf', { type: 'application/pdf' });
    expect(validateImageFile(file)).toBe('validation.imageType');
  });

  it('rejects files over 5 MB', () => {
    const big = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    expect(validateImageFile(big)).toBe('validation.imageSize');
  });
});

describe('validateMessage', () => {
  it('requires text', () => {
    expect(validateMessage('   ')).toBe('validation.required');
  });
  it('caps length at 2000', () => {
    expect(validateMessage('x'.repeat(2001))).toBe('validation.messageLong');
    expect(validateMessage('hello')).toBeNull();
  });
});

describe('validateProfile', () => {
  it('requires a full name and validates phone when present', () => {
    const errors = validateProfile({
      fullName: '',
      orgName: '',
      phone: 'bad',
      address: '',
      language: 'en',
    });
    expect(errors.fullName).toBe('validation.required');
    expect(errors.phone).toBe('validation.phoneInvalid');
  });
});
