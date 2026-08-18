import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { calculateOvertime } from '@/lib/utils';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const month = searchParams.get('month'); // YYYY-MM
    const excludeDate = searchParams.get('excludeDate'); // YYYY-MM-DD

    if (!name || !month) {
      return NextResponse.json({ error: 'Name and month are required' }, { status: 400 });
    }

    // excludeDate が指定されていればその日を除外する
    const result = await sql`
      SELECT date, working_hours 
      FROM reports 
      WHERE name = ${name} 
      AND date LIKE ${month + '%'}
      AND date != ${excludeDate || ''}
    `;

    let totalDays = result.rows.length;
    let totalOvertimeMinutes = 0;

    for (const row of result.rows) {
      try {
        const workingHours = typeof row.working_hours === 'string' ? JSON.parse(row.working_hours) : row.working_hours;
        if (Array.isArray(workingHours)) {
          totalOvertimeMinutes += calculateOvertime(workingHours);
        }
      } catch (e) {
        // 無視して続行
      }
    }

    // 分を時間に変換（0.5刻みになるように少数を残す）
    const totalOvertimeHours = parseFloat((totalOvertimeMinutes / 60).toFixed(2));

    return NextResponse.json({
      totalDays,
      totalOvertimeHours
    });
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
