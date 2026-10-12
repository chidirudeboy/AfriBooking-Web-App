'use client';

import { Check, X } from 'lucide-react';
import { getPasswordChecks } from '@/lib/utils/password';

interface Props {
  password: string;
  confirmPassword?: string;
}

/** Live checklist: shows which password rules are met as the user types. */
export default function PasswordRequirements({ password, confirmPassword }: Props) {
  const checks = getPasswordChecks(password);
  const touched = password.length > 0;
  const allMet = touched && checks.every((c) => c.passed);
  const showMatch = confirmPassword !== undefined && confirmPassword.length > 0;
  const matches = password === confirmPassword;

  return (
    <div className="text-sm" aria-live="polite">
      {allMet ? (
        <p className="mb-1.5 font-medium text-green-600 dark:text-green-400">Password meets all requirements ✓</p>
      ) : (
        <p className="text-gray-600 dark:text-gray-400 mb-1.5">Your password must have:</p>
      )}
      <ul className="space-y-1">
        {checks.map((c) => {
          // "allowed chars" only becomes visible once it is violated
          if (c.key === 'allowed' && c.passed) return null;
          const state = !touched ? 'idle' : c.passed ? 'ok' : 'bad';
          return (
            <li
              key={c.key}
              className={
                state === 'ok'
                  ? 'flex items-center gap-2 text-green-600 dark:text-green-400'
                  : state === 'bad'
                  ? 'flex items-center gap-2 text-red-600 dark:text-red-400'
                  : 'flex items-center gap-2 text-gray-500 dark:text-gray-400'
              }
            >
              {state === 'ok' ? (
                <Check size={14} className="shrink-0" />
              ) : state === 'bad' ? (
                <X size={14} className="shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 shrink-0 rounded-full border border-current opacity-60" />
              )}
              <span>{c.label}</span>
            </li>
          );
        })}
        {showMatch && (
          <li
            className={
              matches
                ? 'flex items-center gap-2 text-green-600 dark:text-green-400'
                : 'flex items-center gap-2 text-red-600 dark:text-red-400'
            }
          >
            {matches ? <Check size={14} className="shrink-0" /> : <X size={14} className="shrink-0" />}
            <span>{matches ? 'Passwords match' : 'Passwords do not match'}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
