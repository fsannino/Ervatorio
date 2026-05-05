import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Sprint 3: add Supabase session check here
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/academico/materiais/:path*'],
};
