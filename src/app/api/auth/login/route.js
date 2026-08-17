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
    
    // 作業員用パスワード（個人別）
    const users = {
      '1201': 'イガラシ　ルイ',
      '1202': 'ナカヤマ　タクミ',
      '1203': 'ナカノ　シンジ'
    };

    if (users[password]) {
      res.cookies.set('auth_token', 'worker', { path: '/', maxAge: 60 * 60 * 24 * 30, httpOnly: true });
      // クライアント側（ブラウザ）で読み取れるように httpOnly を false にする
      res.cookies.set('user_name', encodeURIComponent(users[password]), { path: '/', maxAge: 60 * 60 * 24 * 30, httpOnly: false });
      return res;
    }

    return NextResponse.json({ error: 'パスワードが間違っています' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
