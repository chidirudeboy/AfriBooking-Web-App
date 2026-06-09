'use client';

import { useMemo } from 'react';
import { appVersion, minSupportedVersionWeb, webUpdateUrl } from '@/lib/config/environment';

const parseVersion = (version: string): number[] =>
  version.split('.').map((part) => Number.parseInt(part, 10) || 0);

const isVersionOlder = (installed: string, minimum: string): boolean => {
  const installedParts = parseVersion(installed);
  const minimumParts = parseVersion(minimum);
  const maxLength = Math.max(installedParts.length, minimumParts.length);

  for (let i = 0; i < maxLength; i++) {
    const installedPart = installedParts[i] ?? 0;
    const minimumPart = minimumParts[i] ?? 0;
    if (installedPart < minimumPart) return true;
    if (installedPart > minimumPart) return false;
  }

  return false;
};

export default function AppUpdateBanner() {
  const shouldShow = useMemo(() => {
    if (!minSupportedVersionWeb || minSupportedVersionWeb === '0.0.0') return false;
    return isVersionOlder(appVersion, minSupportedVersionWeb);
  }, []);

  if (!shouldShow) return null;

  const handleUpdate = () => {
    if (webUpdateUrl) {
      window.location.href = webUpdateUrl;
      return;
    }
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-black">
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">
          A new version is required to continue. Please update.
        </div>
        <button
          onClick={handleUpdate}
          className="bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:opacity-90"
        >
          Update now
        </button>
      </div>
    </div>
  );
}
