import test from 'node:test';
import assert from 'node:assert/strict';
import {csvRows} from "../common/csv-evidence.js";
test('exported Vietnamese CSV preserves a BOM, quoted class names and numeric columns',()=>{
  const rows=csvRows('\uFEFFMã lớp,Tên lớp học,Điểm\r\n12,"Lớp A, B",7.5\r\n13,"Lớp ""Nâng cao""",8\r\n');
  assert.deepEqual(rows,[['Mã lớp','Tên lớp học','Điểm'],['12','Lớp A, B','7.5'],['13','Lớp "Nâng cao"','8']]);
});
test('a quoted multiline comment remains one column and truncated quoted exports are rejected',()=>{
  assert.deepEqual(csvRows('a,b\n"dòng 1\ndòng 2",x'),[['a','b'],['dòng 1\ndòng 2','x']]);
  assert.throws(()=>csvRows('a,"unfinished'),/unterminated/);
});
