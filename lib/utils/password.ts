// Mirrors the backend rule: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
export const ALLOWED_SPECIAL_CHARS = '@$!%*?&';

export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordCheck {
  key: 'length' | 'lowercase' | 'uppercase' | 'number' | 'special' | 'allowed';
  label: string;
  passed: boolean;
  /** Message shown when this is the first rule that fails. */
  error: string;
}

export function getPasswordChecks(password: string): PasswordCheck[] {
  const invalidChars = Array.from(new Set(password.match(/[^A-Za-z\d@$!%*?&]/g) || []));
  return [
    {
      key: 'length',
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      passed: password.length >= PASSWORD_MIN_LENGTH,
      error: `Password is too short. It needs at least ${PASSWORD_MIN_LENGTH} characters (you have ${password.length}).`,
    },
    {
      key: 'uppercase',
      label: 'One uppercase letter (A-Z)',
      passed: /[A-Z]/.test(password),
      error: 'Password needs at least one UPPERCASE letter (A-Z).',
    },
    {
      key: 'lowercase',
      label: 'One lowercase letter (a-z)',
      passed: /[a-z]/.test(password),
      error: 'Password needs at least one lowercase letter (a-z).',
    },
    {
      key: 'number',
      label: 'One number (0-9)',
      passed: /\d/.test(password),
      error: 'Password needs at least one number (0-9).',
    },
    {
      key: 'special',
      label: `One special character (${ALLOWED_SPECIAL_CHARS.split('').join(' ')})`,
      passed: /[@$!%*?&]/.test(password),
      error: `Password needs at least one special character: ${ALLOWED_SPECIAL_CHARS.split('').join(' ')}`,
    },
    {
      key: 'allowed',
      label: 'Only letters, numbers and the special characters above',
      passed: invalidChars.length === 0,
      error: `Password contains characters that are not allowed (${invalidChars.join(' ')}). Use only letters, numbers and ${ALLOWED_SPECIAL_CHARS.split('').join(' ')}.`,
    },
  ];
}

/** First problem with the password, or null when it is valid. */
export function getPasswordError(password: string): string | null {
  return getPasswordChecks(password).find((c) => !c.passed)?.error ?? null;
}
