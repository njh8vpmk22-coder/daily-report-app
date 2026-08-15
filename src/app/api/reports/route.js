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

    return NextResponse.json({ id: rows[0].id, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
