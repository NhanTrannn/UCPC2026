import ExcelJS from 'exceljs';

type ExportRow = Record<string, string | number | boolean | null | undefined>;

const BORDER_STYLE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
};

function toSafeSheetName(sheetName: string): string {
  const cleaned = sheetName.replace(/[\\/?*\[\]:]/g, ' ').trim();
  if (!cleaned) {
    return 'Sheet1';
  }

  return cleaned.slice(0, 31);
}

function autoFitColumns(worksheet: ExcelJS.Worksheet, headers: string[], data: ExportRow[]): void {
  headers.forEach((header, index) => {
    const headerLength = header.length;
    const maxValueLength = data.reduce((maxLength, row) => {
      const rawValue = row[header];
      const textValue = rawValue === null || rawValue === undefined ? '' : String(rawValue);
      return Math.max(maxLength, textValue.length);
    }, 0);

    const width = Math.min(Math.max(headerLength, maxValueLength) + 2, 50);
    worksheet.getColumn(index + 1).width = width;
  });
}

function triggerDownload(buffer: ArrayBuffer, fileName: string): void {
  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  const blob = new Blob([
    buffer,
  ], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = finalFileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function exportRowsToExcel(rows: ExportRow[], fileName: string, sheetName: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(toSafeSheetName(sheetName));
  const data = rows.length > 0 ? rows : [{ Message: 'Khong co du lieu' }];
  const headers = Object.keys(data[0]);

  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
  }));

  data.forEach((row) => {
    worksheet.addRow(row);
  });

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF1E293B' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER_STYLE;
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = BORDER_STYLE;
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    });
  });

  autoFitColumns(worksheet, headers, data);

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer as ArrayBuffer, fileName);
}
