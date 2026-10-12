/**
 * Turn any thrown error (axios, fetch, Error, string) into a message that tells the
 * user what actually went wrong. Falls back to `fallback` only when nothing specific
 * can be determined.
 */
const asText = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export function getErrorMessage(error: any, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error || fallback;

  const response = error.response;

  // No response: network failure, timeout, CORS, offline
  if (error.isAxiosError || error.request || error.code) {
    if (!response) {
      if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) {
        return 'The request timed out. Please check your connection and try again.';
      }
      return 'Unable to reach the server. Please check your internet connection and try again.';
    }
  }

  if (response) {
    const data = response.data;
    const status: number = response.status;

    // Field-level validation errors: { errors: { field: ['msg'] } } or { errors: ['msg'] }
    const errors = data?.errors;
    if (errors && typeof errors === 'object') {
      const first = Array.isArray(errors) ? errors[0] : (Object.values(errors) as any[])[0];
      const msg = Array.isArray(first) ? first[0] : first;
      const text = typeof msg === 'string' ? msg : asText(msg?.message);
      if (text) return text;
    }

    const serverMessage =
      asText(data?.error) || asText(data?.message) || asText(data?.error?.message) || (typeof data === 'string' && data.length < 200 && !data.includes('<') ? data.trim() : '');
    if (serverMessage) return serverMessage;

    switch (status) {
      case 400: return 'The request was invalid. Please check your details and try again.';
      case 401: return 'Your session has expired or you are not signed in. Please log in again.';
      case 403: return 'You do not have permission to do this.';
      case 404: return 'We could not find what you were looking for.';
      case 409: return 'This conflicts with an existing record. Please check and try again.';
      case 413: return 'The file you uploaded is too large.';
      case 422: return 'Some of the information provided is not valid. Please review and try again.';
      case 429: return 'Too many attempts. Please wait a moment and try again.';
      default:
        if (status >= 500) return 'Our server is having trouble right now. Please try again shortly.';
    }
  }

  const own = asText(error.message);
  if (own && !/^Request failed with status code/i.test(own) && own !== 'Network Error') return own;
  if (own === 'Network Error') return 'Unable to reach the server. Please check your internet connection and try again.';
  return fallback;
}
