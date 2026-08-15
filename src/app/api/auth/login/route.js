import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { password } = await req.json();

    const res = NextResponse.json({ success: true });

    // 管理者用パスワード
    if (password === '2101') {
      res.cookies.set('auth_token', 'admin', { path: '/', maxAge: 60 * 60 * 24 * 30, httpOnly: true });
      return res;
    } 
    // 作業員用パスワード
    else if (password === '1200') {
      res.cookies.set('auth_token', 'worker', { path: '/', maxAge: 60 * 60 * 24 * 30, httpOnly: true });
      return res;
    }

    return NextResponse.json({ error: 'パスワードが間違っています' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
