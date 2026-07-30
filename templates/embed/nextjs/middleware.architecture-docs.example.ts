/**
 * Example Next.js middleware — block architecture docs in production.
 *
 * 1. Copy relevant parts into `src/middleware.ts` or `src/proxy.ts` (Next.js 16+).
 * 2. Set `site.exposure` in architecture.config.json:
 *    - dev-staging (default): docs on dev/staging only
 *    - production: remove this guard if docs should be public in prod
 *
 * Mount path must match architecture.config.json → site.mountPath (default /architecture/).
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Must match site.mountPath in architecture.config.json (no trailing slash). */
export const ARCHITECTURE_DOCS_PATH = '/architecture';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    process.env.NODE_ENV === 'production' &&
    (pathname === ARCHITECTURE_DOCS_PATH ||
      pathname.startsWith(`${ARCHITECTURE_DOCS_PATH}/`))
  ) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  // Static strings only — Next.js cannot parse dynamic matcher values at compile time.
  matcher: ['/architecture', '/architecture/:path*'],
};
