import { NextResponse } from 'next/server';

export function middleware(req) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === '1126' && pwd === '1126') {
      return NextResponse.next();
    }
  }
  
  // 認証失敗時
  url.pathname = '/api/auth';
  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  // すべてのページ（APIと静的ファイルを除く）に適用
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
