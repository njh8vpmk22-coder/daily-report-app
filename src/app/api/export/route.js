import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    let rows;
    if (month) {
      const result = await sql`SELECT * FROM reports WHERE date LIKE ${month + '%'} ORDER BY date DESC, created_at DESC;`;
      rows = result.rows;
    } else {
      const result = await sql`SELECT * FROM reports ORDER BY date DESC, created_at DESC;`;
      rows = result.rows;
    }

    const { formatWorkingHoursText } = await import('@/lib/utils');
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('日報データ');

    // 列の定義（幅を広めに設定）
    sheet.columns = [
      { header: '日付', key: 'date', width: 15 },
      { header: '氏名', key: 'name', width: 20 },
      { header: '稼働時間', key: 'workingHours', width: 35 },
      { header: '施工場所', key: 'location', width: 30 },
      { header: '業務内容', key: 'content', width: 50 },
      { header: '備考', key: 'remarks', width: 35 }
    ];

    // ヘッダー行のスタイル設定（背景色、太字、罫線）
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' } // 薄い青色
      };
      cell.font = { bold: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // データの追加とスタイルの適用
    rows.forEach((row) => {
      let workingHoursStr = '';
      try {
        const hours = typeof row.working_hours === 'string' ? JSON.parse(row.working_hours) : row.working_hours;
        if (Array.isArray(hours)) {
          workingHoursStr = formatWorkingHoursText(hours);
        }
      } catch(e) {}

      const addedRow = sheet.addRow({
        date: row.date,
        name: row.name,
        workingHours: workingHoursStr,
        location: row.location,
        content: row.content,
        remarks: row.remarks || ''
      });

      // 各セルに罫線を追加し、折り返し設定
      addedRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
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
