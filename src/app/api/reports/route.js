import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // テーブルが存在しない場合は作成 (初回のみ)
    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        date VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 稼働時間のカラムを追加（すでに存在する場合は無視される）
    await sql`
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '[]'::jsonb;
    `;

    const { rows } = await sql`SELECT * FROM reports ORDER BY date DESC, created_at DESC;`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error in GET /api/reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, name, location, content, remarks, working_hours } = body;

    if (!date || !name || !location || !content) {
      return NextResponse.json({ error: '必須項目が不足しています。' }, { status: 400 });
    }

    // 稼働時間のカラムを追加（念のためここでも実行）
    await sql`
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '[]'::jsonb;
    `;

    const workingHoursJson = working_hours ? JSON.stringify(working_hours) : '[]';

    const { rows } = await sql`
      INSERT INTO reports (date, name, location, content, remarks, working_hours)
      VALUES (${date}, ${name}, ${location}, ${content}, ${remarks}, ${workingHoursJson})
      RETURNING id;
    `;

    // メール通知の送信 (FormSubmit.co を使用)
    try {
      let workingHoursText = '';
      if (Array.isArray(working_hours)) {
        workingHoursText = working_hours.map(h => `${h.start}〜${h.end}`).join(', ');
      }

      await fetch('https://formsubmit.co/ajax/fugfuurgh57@yahoo.co.jp', {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            _subject: `【日報提出】${name}さんから日報が提出されました`,
            '日付': date,
            '氏名': name,
            '稼働時間': workingHoursText,
            '施工場所': location,
            '業務内容': content,
            '備考': remarks || 'なし',
        })
      });
    } catch (emailError) {
      console.error('メール送信エラー（日報は保存されています）:', emailError);
    }

    return NextResponse.json({ id: rows[0].id, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
