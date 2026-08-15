"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../globals.css';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        // パスワードに応じて自動で遷移先を変える
        if (password === '2101') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/create';
        }
      } else {
        const data = await res.json();
        setError(data.error || 'ログインに失敗しました');
      }
    } catch (err) {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container form-container" style={{ marginTop: '10vh' }}>
      <header className="header">
        <h1>日報システム</h1>
      </header>
      <main>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
              className="form-control"
              style={{ fontSize: '1.25rem', padding: '0.75rem', textAlign: 'center', letterSpacing: '0.2em' }}
            />
          </div>
          
          {error && <div style={{ color: '#ef4444', fontWeight: 'bold', textAlign: 'center' }}>{error}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '1rem', fontSize: '1.1rem' }}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </main>
    </div>
  );
}
