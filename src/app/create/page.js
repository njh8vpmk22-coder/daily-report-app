"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatWorkingHoursText } from '@/lib/utils';

export default function CreateReport() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('ja-JP').replace(/\//g, '-').split('-').map(p => p.padStart(2, '0')).join('-'), // YYYY-MM-DD
    name: '',
    location: '',
    content: '',
    remarks: ''
  });

  const [workingHours, setWorkingHours] = useState([
    { start: '09:00', end: '17:00' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ページ読み込み時にCookieから名前を取得
  useEffect(() => {
    const getCookieValue = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) {
        try {
          let val = match[2];
          // Vercel/Next.jsの仕様で二重にエンコードされることがあるため、完全にデコードされるまで繰り返す
          while (val.includes('%25')) {
            val = decodeURIComponent(val);
          }
          return decodeURIComponent(val);
        } catch (e) {
          return '';
        }
      }
      return '';
    };

    const userName = getCookieValue('user_name');
    if (userName) {
      setFormData(prev => ({ ...prev, name: userName }));
    }
  }, []);

  const [stats, setStats] = useState(null);

  // 名前か日付が変更されたら集計データを取得する
  useEffect(() => {
    if (formData.name && formData.date) {
      const month = formData.date.substring(0, 7); // YYYY-MM
      fetch(`/api/stats?name=${encodeURIComponent(formData.name)}&month=${month}&excludeDate=${formData.date}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setStats(data);
          }
        })
        .catch(() => {});
    }
  }, [formData.name, formData.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkingHourChange = (index, field, value) => {
    const newWorkingHours = [...workingHours];
    newWorkingHours[index][field] = value;
    setWorkingHours(newWorkingHours);
  };

  const addWorkingHour = () => {
    setWorkingHours([...workingHours, { start: '', end: '' }]);
  };

  const removeWorkingHour = (index) => {
    const newWorkingHours = [...workingHours];
    newWorkingHours.splice(index, 1);
    setWorkingHours(newWorkingHours);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 空の時間エントリを除外
    const validWorkingHours = workingHours.filter(h => h.start && h.end);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          working_hours: validWorkingHours
        }),
      });
      
      if (res.ok) {
        // メール通知 (FormSubmit.co) をフロント側から実行する
        try {
          const workingHoursText = formatWorkingHoursText(validWorkingHours);

          const emails = ['fugfuurgh57@yahoo.co.jp', 'igarasimiyagi@yahoo.co.jp'];
          
          for (const email of emails) {
            const mailRes = await fetch(`https://formsubmit.co/ajax/${email}`, {
              method: "POST",
              headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
              },
              body: JSON.stringify({
                  _subject: `【日報提出】${formData.name}さんから日報が提出されました`,
                  '日付': formData.date,
                  '氏名': formData.name,
                  '稼働時間': workingHoursText,
                  '施工場所': formData.location,
                  '業務内容': formData.content,
                  '備考': formData.remarks || 'なし',
              })
            });

            if (!mailRes.ok) {
              console.error(`Mail service error for ${email}, status:`, mailRes.status);
            }
          }
        } catch (e) {
          console.error('Mail error', e);
          alert('日報は保存されましたが、メール通知システムでエラーが発生しました: ' + e.message);
        }
        
        alert('日報の送信が完了しました！お疲れ様でした。');
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
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
      <header className="header" style={{ display: 'flex', alignItems: 'center' }}>
        <h1>日報作成</h1>
        <button 
          onClick={async () => {
            if(confirm('ログアウトしますか？')){
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }
          }}
          className="btn btn-secondary"
          style={{ marginLeft: 'auto' }}
        >
          ログアウト
        </button>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label htmlFor="date">日付 <span className="required">*</span></label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="name">氏名 <span className="required">*</span></label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name} 
              readOnly 
              required 
              style={{ backgroundColor: '#f3f4f6', color: '#4b5563', cursor: 'not-allowed', width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }} 
            />
          </div>

          <div className="form-group">
            <label>稼働時間 <span className="required">*</span></label>
            <div className="working-hours-container">
              {workingHours.map((wh, index) => (
                <div key={index} className="working-hour-row">
                  <input 
                    type="time" 
                    value={wh.start} 
                    onChange={(e) => handleWorkingHourChange(index, 'start', e.target.value)}
                    required
                  />
                  <span>〜</span>
                  <input 
                    type="time" 
                    value={wh.end} 
                    onChange={(e) => handleWorkingHourChange(index, 'end', e.target.value)}
                    required
                  />
                  {workingHours.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeWorkingHour(index)}
                      className="btn-icon delete-btn"
                      title="削除"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={addWorkingHour} 
                className="btn btn-secondary add-time-btn"
              >
                ＋ 稼働時間を追加
              </button>
            </div>
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

          {stats && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#166534', fontSize: '1.1rem' }}>
                📊 【あなたの今月の稼働状況（入力日を除く）】
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#15803d', fontSize: '1.05rem', lineHeight: '1.6' }}>
                <li><strong>出勤日数：</strong> {stats.totalDays} 日</li>
                <li><strong>残業時間計：</strong> {stats.totalOvertimeHours > 0 ? `${stats.totalOvertimeHours} 時間` : '0 時間'}</li>
              </ul>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
