"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import './globals.css';

export default function Home() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        setLoading(false);
      });
  }, []);

  // 稼働時間をフォーマットして表示する関数
  const renderWorkingHours = (workingHoursStr) => {
    if (!workingHoursStr) return '記録なし';
    try {
      const hours = typeof workingHoursStr === 'string' ? JSON.parse(workingHoursStr) : workingHoursStr;
      if (!Array.isArray(hours) || hours.length === 0) return '記録なし';
      
      return hours.map((h, i) => (
        <span key={i} className="working-hour-badge">
          {h.start}〜{h.end}
        </span>
      ));
    } catch (e) {
      return '記録なし';
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>日報一覧</h1>
        <Link href="/create" className="btn btn-primary">日報を作成</Link>
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
