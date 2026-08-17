import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('auth_token', '', { path: '/', maxAge: 0 });
  res.cookies.set('user_name', '', { path: '/', maxAge: 0 });
  return res;
}
