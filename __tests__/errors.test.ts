import { getErrorMessage } from '@/lib/utils/errors';

const axiosErr = (status: number | null, data?: any, extra: any = {}) => ({
  isAxiosError: true,
  message: 'Request failed',
  ...(status ? { response: { status, data } } : { request: {} }),
  ...extra,
});

describe('getErrorMessage', () => {
  it('prefers the backend `error` field', () => {
    expect(getErrorMessage(axiosErr(400, { error: 'Email or phone number already exists' }))).toBe('Email or phone number already exists');
  });
  it('falls back to the `message` field', () => {
    expect(getErrorMessage(axiosErr(400, { message: 'Bad thing' }))).toBe('Bad thing');
  });
  it('uses the first field-level validation error', () => {
    expect(getErrorMessage(axiosErr(422, { errors: { email: ['Email is invalid'] } }))).toBe('Email is invalid');
  });
  it('explains network failures and timeouts', () => {
    expect(getErrorMessage(axiosErr(null))).toMatch(/Unable to reach the server/);
    expect(getErrorMessage(axiosErr(null, undefined, { code: 'ECONNABORTED' }))).toMatch(/timed out/);
  });
  it('explains status codes when the body has no message', () => {
    expect(getErrorMessage(axiosErr(429, {}))).toMatch(/Too many/);
    expect(getErrorMessage(axiosErr(500, {}))).toMatch(/server is having trouble/);
  });
  it('uses the fallback when nothing is known', () => {
    expect(getErrorMessage(undefined, 'Custom fallback')).toBe('Custom fallback');
  });
});
