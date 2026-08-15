import { NextResponse } from 'next/server';

export function middleware(req) {
  const url = req.nextUrl;
  const authToken = req.cookies.get('auth_token')?.value;

  // ログイン画面や認証APIはスキップ
  if (url.pathname.startsWith('/login') || url.pathname.startsWith('/api/auth')) {
    // すでにログイン済みの場合は、適切な画面へ自動リダイレクト
    if (url.pathname === '/login' && authToken) {
      if (authToken === 'admin') {
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      } else if (authToken === 'worker') {
        url.pathname = '/create';
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  const isAdminRoute = url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/export');
  const isWorkerRoute = url.pathname.startsWith('/create') || url.pathname.startsWith('/api/reports');

  // 管理者ルートのチェック
  if (isAdminRoute) {
    if (authToken === 'admin') {
      return NextResponse.next();
    } else {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // 作業員ルートのチェック
  if (isWorkerRoute) {
    if (authToken === 'worker' || authToken === 'admin') {
      return NextResponse.next();
    } else {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // 未ログイン状態でその他のページ（/など）にアクセスした場合はログイン画面へ
  if (!authToken) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
