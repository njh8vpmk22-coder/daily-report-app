import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM reports ORDER BY date DESC, created_at DESC;`;

    // エクセル用にデータを整形
    const excelData = rows.map(row => {
      let workingHoursStr = '';
      try {
        const hours = typeof row.working_hours === 'string' ? JSON.parse(row.working_hours) : row.working_hours;
        if (Array.isArray(hours)) {
          workingHoursStr = hours.map(h => `${h.start}〜${h.end}`).join(', ');
        }
      } catch(e) {}

      return {
        '日付': row.date,
        '氏名': row.name,
        '稼働時間': workingHoursStr,
        '施工場所': row.location,
        '業務内容': row.content,
        '備考': row.remarks
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '日報データ');

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="daily_reports.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
