import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_MEDIA_HOSTS = new Set([
  'africartz.s3.eu-north-1.amazonaws.com',
]);

const apiBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://api.africartz.com/api').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Please sign in to download media.' }, { status: 401 });
  }

  const profileResponse = await fetch(`${apiBaseUrl}/auth/user-profile`, {
    headers: { Authorization: authorization },
    cache: 'no-store',
  }).catch(() => null);

  if (!profileResponse?.ok) {
    return NextResponse.json({ message: 'Your session is no longer valid. Please sign in again.' }, { status: 401 });
  }

  const requestedUrl = request.nextUrl.searchParams.get('url');
  if (!requestedUrl) {
    return NextResponse.json({ message: 'A media URL is required.' }, { status: 400 });
  }

  let mediaUrl: URL;
  try {
    mediaUrl = new URL(requestedUrl);
  } catch {
    return NextResponse.json({ message: 'The media URL is invalid.' }, { status: 400 });
  }

  if (mediaUrl.protocol !== 'https:' || !ALLOWED_MEDIA_HOSTS.has(mediaUrl.hostname)) {
    return NextResponse.json({ message: 'This media source is not allowed.' }, { status: 403 });
  }

  const mediaResponse = await fetch(mediaUrl, { cache: 'no-store' }).catch(() => null);
  if (!mediaResponse?.ok || !mediaResponse.body) {
    return NextResponse.json({ message: 'The selected media is currently unavailable.' }, { status: 502 });
  }

  const headers = new Headers();
  headers.set('Content-Type', mediaResponse.headers.get('content-type') || 'application/octet-stream');
  headers.set('Cache-Control', 'private, no-store');
  const contentLength = mediaResponse.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);

  return new Response(mediaResponse.body, { status: 200, headers });
}
