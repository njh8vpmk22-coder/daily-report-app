"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatWorkingHoursText } from '@/lib/utils';
import '../globals.css';

export default function AdminHome() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 今月を初期値にする (YYYY-MM)
  const currentDate = new Date();
  const initialMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?month=${selectedMonth}`)
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        setLoading(false);
      });
  }, [selectedMonth]);

  // 稼働時間と残業時間をフォーマットして表示する関数
  const renderWorkingHours = (workingHoursStr) => {
    if (!workingHoursStr) return '記録なし';
    try {
      const hours = typeof workingHoursStr === 'string' ? JSON.parse(workingHoursStr) : workingHoursStr;
      if (!Array.isArray(hours) || hours.length === 0) return '記録なし';
      
      return (
        <span className="working-hour-badge">
          {formatWorkingHoursText(hours)}
        </span>
      );
    } catch (e) {
      return '記録なし';
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>日報一覧（管理者用）</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-selector"
            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #ccc' }}
          />
          <a href={`/api/export?month=${selectedMonth}`} className="btn btn-secondary">⬇️ エクセルで保存</a>
        </div>
      </header>

      <main>
        {loading ? (
          <p>読み込み中...</p>
        ) : reports.length === 0 ? (
          <p>まだ日報がありません。</p>
        ) : (
          <div className="report-grid">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <h2>{report.date}</h2>
                  <span className="report-author">{report.name}</span>
                </div>
                <div className="report-body">
                  <p><strong>📍 施工場所:</strong> {report.location}</p>
                  <p className="working-hours-display">
                    <strong>⏱️ 稼働時間:</strong> {renderWorkingHours(report.working_hours)}
                  </p>
                  <p><strong>📝 業務内容:</strong></p>
                  <pre className="report-content">{report.content}</pre>
                  {report.remarks && (
                    <>
                      <p><strong>💡 備考:</strong></p>
                      <pre className="report-content remarks">{report.remarks}</pre>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
