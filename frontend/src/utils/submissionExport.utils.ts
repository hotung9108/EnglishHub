export interface EnrolledStudentSubmissionData {
  studentId: number;
  code: string;
  name: string;
  status: 'submitted' | 'in_progress' | 'missing' | string;
  gradingStatus: 'graded' | 'pending' | 'none' | string;
  submissionId?: number;
  finalScore?: number | null;
}

export interface ExportSubmissionsOptions {
  assignmentId: number | string;
  assignmentTitle?: string;
  className?: string;
  students: EnrolledStudentSubmissionData[];
  isVi?: boolean;
}

export function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function generateSubmissionsCsvContent(options: ExportSubmissionsOptions): string {
  const { assignmentId, assignmentTitle, className, students, isVi = true } = options;

  const headers = [
    isVi ? 'Mã học viên' : 'Student Code',
    isVi ? 'Họ và tên' : 'Full Name',
    isVi ? 'Trạng thái nộp' : 'Submission Status',
    isVi ? 'Trạng thái chấm' : 'Grading Status',
    isVi ? 'Điểm số (/10)' : 'Score (/10)',
  ];

  const rows: string[][] = [
    [isVi ? 'DANH SÁCH BÀI NỘP BÀI TẬP' : 'ASSIGNMENT SUBMISSIONS LIST'],
    [isVi ? 'Mã bài tập' : 'Assignment ID', String(assignmentId)],
    ...(assignmentTitle ? [[isVi ? 'Tiêu đề bài tập' : 'Assignment Title', assignmentTitle]] : []),
    ...(className ? [[isVi ? 'Lớp học' : 'Class', className]] : []),
    [isVi ? 'Thời gian xuất' : 'Exported At', new Date().toLocaleString(isVi ? 'vi-VN' : 'en-US')],
    [],
    headers,
  ];

  for (const student of students) {
    let statusLabel = isVi ? 'Chưa nộp bài' : 'Missing';
    if (student.status === 'submitted') {
      statusLabel = isVi ? 'Đã nộp bài' : 'Submitted';
    } else if (student.status === 'in_progress') {
      statusLabel = isVi ? 'Đang làm bài' : 'In Progress';
    }

    let gradingLabel = isVi ? 'Chưa có bài' : 'Not Submitted';
    if (student.gradingStatus === 'graded') {
      gradingLabel = isVi ? 'Đã chấm' : 'Graded';
    } else if (student.gradingStatus === 'pending') {
      gradingLabel = isVi ? 'Chờ chấm' : 'Pending';
    }

    const scoreLabel = student.finalScore !== null && student.finalScore !== undefined
      ? String(student.finalScore)
      : '';

    rows.push([
      student.code,
      student.name,
      statusLabel,
      gradingLabel,
      scoreLabel,
    ]);
  }

  return '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
}

export function exportSubmissionsToCsv(options: ExportSubmissionsOptions): void {
  const csvContent = generateSubmissionsCsvContent(options);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeId = options.assignmentId || 'detail';
  const filename = `submissions-assignment-${safeId}-${dateStr}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==========================================
// PURE TYPESCRIPT OPENXML (.XLSX) GENERATION
// ==========================================

function crc32(buf: Uint8Array): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (((crc ^ byte) & 1) ? 0xedb88320 : 0);
      byte >>>= 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function createUncompressedZip(entries: ZipEntry[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const centralDirParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const data = entry.data;
    const crc = crc32(data);
    const size = data.length;

    // Local file header (30 bytes + name length)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // STORED (uncompressed)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(data);

    // Central directory header (46 bytes + name length)
    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cdHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    cdHeader.set(nameBytes, 46);

    centralDirParts.push(cdHeader);
    offset += localHeader.length + data.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const p of centralDirParts) {
    parts.push(p);
    centralDirSize += p.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralDirSize, true);
  ev.setUint32(16, centralDirOffset, true);
  ev.setUint16(20, 0, true);

  parts.push(eocd);

  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }

  return result;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSubmissionsXlsxBlob(options: ExportSubmissionsOptions): Blob {
  const { assignmentId, assignmentTitle, className, students, isVi = true } = options;

  let rowIdx = 1;
  const rowsXml: string[] = [];

  const addRow = (cells: { val: string | number; isNum?: boolean }[]) => {
    const colLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const cellsXml = cells.map((cell, idx) => {
      const col = colLetters[idx] || 'A';
      const cellRef = `${col}${rowIdx}`;
      if (cell.isNum && typeof cell.val === 'number') {
        return `<c r="${cellRef}"><v>${cell.val}</v></c>`;
      }
      return `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(String(cell.val))}</t></is></c>`;
    }).join('');
    rowsXml.push(`<row r="${rowIdx}">${cellsXml}</row>`);
    rowIdx++;
  };

  // Header information
  addRow([{ val: isVi ? 'DANH SÁCH BÀI NỘP BÀI TẬP' : 'ASSIGNMENT SUBMISSIONS LIST' }]);
  addRow([{ val: isVi ? 'Mã bài tập' : 'Assignment ID' }, { val: String(assignmentId) }]);
  if (assignmentTitle) {
    addRow([{ val: isVi ? 'Tiêu đề bài tập' : 'Assignment Title' }, { val: assignmentTitle }]);
  }
  if (className) {
    addRow([{ val: isVi ? 'Lớp học' : 'Class' }, { val: className }]);
  }
  addRow([{ val: isVi ? 'Thời gian xuất' : 'Exported At' }, { val: new Date().toLocaleString(isVi ? 'vi-VN' : 'en-US') }]);
  
  // Empty row before table
  addRow([]);

  // Table Headers
  addRow([
    { val: isVi ? 'Mã học viên' : 'Student Code' },
    { val: isVi ? 'Họ và tên' : 'Full Name' },
    { val: isVi ? 'Trạng thái nộp' : 'Submission Status' },
    { val: isVi ? 'Trạng thái chấm' : 'Grading Status' },
    { val: isVi ? 'Điểm số (/10)' : 'Score (/10)' },
  ]);

  // Data rows
  for (const student of students) {
    let statusLabel = isVi ? 'Chưa nộp bài' : 'Missing';
    if (student.status === 'submitted') {
      statusLabel = isVi ? 'Đã nộp bài' : 'Submitted';
    } else if (student.status === 'in_progress') {
      statusLabel = isVi ? 'Đang làm bài' : 'In Progress';
    }

    let gradingLabel = isVi ? 'Chưa có bài' : 'Not Submitted';
    if (student.gradingStatus === 'graded') {
      gradingLabel = isVi ? 'Đã chấm' : 'Graded';
    } else if (student.gradingStatus === 'pending') {
      gradingLabel = isVi ? 'Chờ chấm' : 'Pending';
    }

    const hasScore = student.finalScore !== null && student.finalScore !== undefined;

    addRow([
      { val: student.code },
      { val: student.name },
      { val: statusLabel },
      { val: gradingLabel },
      hasScore 
        ? { val: Number(student.finalScore), isNum: true } 
        : { val: '' },
    ]);
  }

  const te = new TextEncoder();
  const contentTypes = te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`);

  const rels = te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

  const wbRels = te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);

  const wb = te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Submissions" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);

  const sheet1 = te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${rowsXml.join('')}
  </sheetData>
</worksheet>`);

  const zipBytes = createUncompressedZip([
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rels },
    { name: 'xl/_rels/workbook.xml.rels', data: wbRels },
    { name: 'xl/workbook.xml', data: wb },
    { name: 'xl/worksheets/sheet1.xml', data: sheet1 },
  ]);

  return new Blob([zipBytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function exportSubmissionsToExcel(options: ExportSubmissionsOptions): void {
  const blob = generateSubmissionsXlsxBlob(options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeId = options.assignmentId || 'detail';
  const filename = `submissions-assignment-${safeId}-${dateStr}.xlsx`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
