"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateReport() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('ja-JP').replace(/\//g, '-').split('-').map(p => p.padStart(2, '0')).join('-'), // YYYY-MM-DD
    name: '',
    location: '',
    content: '',
    remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const errorData = await res.json();
        alert('エラーが発生しました: ' + errorData.error);
      }
    } catch (error) {
      alert('通信エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container form-container">
      <header className="header">
        <h1>日報作成</h1>
        <Link href="/" className="btn btn-secondary">戻る</Link>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label htmlFor="date">日付 <span className="required">*</span></label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="name">氏名 <span className="required">*</span></label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="例: 山田太郎" />
          </div>

          <div className="form-group">
            <label htmlFor="location">施工場所 <span className="required">*</span></label>
            <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required placeholder="例: 〇〇ビル新築工事" />
          </div>

          <div className="form-group">
            <label htmlFor="content">業務内容 <span className="required">*</span></label>
            <textarea id="content" name="content" value={formData.content} onChange={handleChange} required rows="5" placeholder="本日の作業内容を詳しく記入してください"></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="remarks">備考欄</label>
            <textarea id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} rows="3" placeholder="気づいたこと、引き継ぎ事項などを自由に記入してください"></textarea>
          </div>

          <button type="submit" className="btn btn-primary submit-btn" disabled={isSubmitting}>
            {isSubmitting ? '送信中...' : '送信する'}
          </button>
        </form>
      </main>
    </div>
  );
}
