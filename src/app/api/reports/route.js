import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const name = searchParams.get('name');

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

    let rows;
    if (month && name) {
      const result = await sql`SELECT * FROM reports WHERE date LIKE ${month + '%'} AND name = ${name} ORDER BY date DESC, created_at DESC;`;
      rows = result.rows;
    } else if (month) {
      const result = await sql`SELECT * FROM reports WHERE date LIKE ${month + '%'} ORDER BY date DESC, created_at DESC;`;
      rows = result.rows;
    } else if (name) {
      const result = await sql`SELECT * FROM reports WHERE name = ${name} ORDER BY date DESC, created_at DESC;`;
      rows = result.rows;
    } else {
      const result = await sql`SELECT * FROM reports ORDER BY date DESC, created_at DESC;`;
      rows = result.rows;
    }
    
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

    // 同日・同名の日報が既に存在するかチェック
    const existing = await sql`SELECT id FROM reports WHERE date = ${date} AND name = ${name} LIMIT 1`;

    let reportId;
    if (existing.rows.length > 0) {
      // 存在する場合は上書き（UPDATE）
      reportId = existing.rows[0].id;
      await sql`
        UPDATE reports 
        SET location = ${location}, 
            content = ${content}, 
            remarks = ${remarks}, 
            working_hours = ${workingHoursJson}, 
            created_at = CURRENT_TIMESTAMP
        WHERE id = ${reportId}
      `;
    } else {
      // 存在しない場合は新規作成（INSERT）
      const { rows } = await sql`
        INSERT INTO reports (date, name, location, content, remarks, working_hours)
        VALUES (${date}, ${name}, ${location}, ${content}, ${remarks}, ${workingHoursJson})
        RETURNING id;
      `;
      reportId = rows[0].id;
    }

    return NextResponse.json({ id: reportId, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
