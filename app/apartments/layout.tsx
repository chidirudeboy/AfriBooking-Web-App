'use client';

export default function ApartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow viewing apartments without login (matching mobile app behavior)
  // Login will be required only when users perform actions like requesting reservations
  return <>{children}</>;
}

