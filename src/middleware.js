import { NextResponse } from 'next/server';

export function middleware(req) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  const isAdminRoute = url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/export');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (isAdminRoute) {
      // 管理者用パスワード
      if (user === 'admin' && pwd === 'admin') {
        return NextResponse.next();
      }
    } else {
      // 作業員用パスワード
      if (user === '1126' && pwd === '1126') {
        return NextResponse.next();
      }
      // 管理者権限でも通常画面を見れるようにする
      if (user === 'admin' && pwd === 'admin') {
        return NextResponse.next();
      }
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
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
