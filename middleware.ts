// middleware.ts (Root folder me)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Student/Candidate ke kisi bhi route par koi auth check nahi lagega
  if (request.nextUrl.pathname.startsWith('/interview')) {
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
