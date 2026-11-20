import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { readdir, readFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { openAssignment } from "../../../common/flows/support/teacher/assignments.js";

import { start, answer, submit, verifySubmitted } from "../../../common/flows/support/student/attempts.js";

import {csvRows} from "../../../common/csv-evidence.js";

import { score, feedback, save, reason, escapeRegex, aiSuggestion, annotationCard, gradingFixture, editor, grade, manual, classProgress } from "../../../common/flows/grading.js";



export const cases = {
RES_008:scenario('admin',async(ctx,ui)=>{await ctx.step('Báo cáo tổng; đối chiếu đúng từng chỉ số, không nhầm tỷ lệ với số lượng',async()=>{
    await ui.nav('/admin/reports');await ui.ready();const snapshot=await ctx.driver.executeScript('return (window.__srsNetwork||[]).filter(r=>r.path.endsWith("/reports/overview")&&r.status===200).at(-1)');assert.ok(snapshot?.response,'Must capture the report response for the exact UI filters');const expected=snapshot.response;await ctx.evidence('overview',snapshot);
    for(const [key,label] of [['classCount',/TỔNG LỚP ĐANG THEO DÕI|MONITORED CLASSES/i],['completionRatePercent',/TỶ LỆ HOÀN THÀNH|COMPLETION RATE/i],['averageScorePercent',/ĐIỂM TRUNG BÌNH|AVERAGE SCORE/i],['pendingGradingCount',/CHỜ CHẤM|PENDING GRADING/i]]){
      let found=false;for(const card of await ctx.driver.findElements(By.css('.metric-card'))){const title=await card.findElement(By.css('.metric-title')).getText();if(!label.test(title))continue;const value=await card.findElement(By.css('.metric-value')).getText();assert.equal(Number(value.replace('%','').replace(',','.')),Number(expected[key]),`Metric ${key}`);found=true;break;}assert.ok(found,`Missing metric ${key}`);
    }
    await ui.has(/tổng số người dùng|total users/i);await ui.has(/tổng số bài nộp|total submissions/i);await ui.has(/phổ điểm|score distribution/i);
  });}),
RES_009:scenario('admin',async(ctx,ui)=>{await ctx.step('Lọc thời gian không dữ liệu; phải giải thích và gợi ý mở rộng',async()=>{await ui.nav('/admin/reports');let dates=await ctx.driver.findElements(By.css('main input[type=date]'));assert.equal(dates.length,2);await ui.date(dates[0],'1990-01-01');dates=await ctx.driver.findElements(By.css('main input[type=date]'));await ui.date(dates[1],'1990-01-02');await ui.has(/không.*dữ liệu|no.*data/i);await ui.has(/mở rộng|thay đổi.*lọc|expand|adjust.*filter/i);const actual=await ctx.pool.get('admin','/reports/overview?from=1990-01-01&to=1990-01-02');await ctx.evidence('empty-period',actual);assert.equal(actual.assignedAssignmentCount,0);});}),
RES_010:scenario('admin',async(ctx,ui)=>{await ctx.step('Xuất CSV theo lớp riêng; đối chiếu số liệu với response của chính bộ lọc UI',async()=>{
    await ui.nav('/admin/reports');await ui.select(`main select:has(option[value="${ctx.pool.class.id}"])`,ctx.pool.class.id);
    let snapshot;await ctx.driver.wait(async()=>{snapshot=await ctx.driver.executeScript('const events=window.__srsNetwork||[];const overview=events.filter(e=>e.path.endsWith("/reports/overview")&&e.status===200&&new URLSearchParams(e.query).get("classId")===arguments[0]).at(-1);const classes=events.filter(e=>e.path.endsWith("/reports/classes")&&e.status===200).at(-1);if(!overview||!classes)return null;return {...classes,selectedClassId:arguments[0],overview,response:{...classes.response,data:classes.response.data.filter(r=>String(r.classId)===arguments[0])}}',String(ctx.pool.class.id));return snapshot?.response?.data?.length===1;},15000,'Capture the selected overview and the matching row from the client-filtered class report');
    await ui.ready();await ctx.evidence('export-source-response',snapshot);
    await ctx.driver.sendDevToolsCommand('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:join(ctx.output,ctx.test.id)});await ui.button(/^Xuất báo cáo(?:\s*\(CSV\))?$|^Export(?: Report)?(?:\s*\(CSV\))?$/i);
    let files;await ctx.driver.wait(async()=>{files=(await readdir(join(ctx.output,ctx.test.id))).filter(f=>/\.(csv|xlsx|pdf)$/i.test(f));return files.length>0;},15000,'Export must create a completed download');assert.equal(files.length,1);
    const file=files[0];ctx.result.evidence.push(`${ctx.test.id}/${file}`);const bytes=await readFile(join(ctx.output,ctx.test.id,file));assert.ok(bytes.length>50);
    if(!file.endsWith('.csv'))throw new Blocked('Đã tải file nhưng chưa có bộ đọc XLSX/PDF để nghiệm thu nội dung.');
    const text=bytes.toString('utf8');assert.ok(!text.includes('\uFFFD'),'CSV must decode as UTF-8 without replacement characters');const rows=csvRows(text);const headerIndex=rows.findIndex(row=>/Mã lớp|Class.*ID/i.test(row[0]));assert.ok(headerIndex>=0,'CSV class table requires a readable header');
    const dataRows=rows.slice(headerIndex+1).filter(row=>row.length>=6);assert.equal(dataRows.length,1,'Export must honor the selected class filter');const row=dataRows[0],expected=snapshot.response.data[0];
    assert.ok([String(expected.classId),`ENG-${expected.classId}`].includes(row[0]));assert.equal(row[1],expected.className);assert.equal(Number(row[3]),expected.assignedAssignmentCount);
    const percent=value=>Number(value.replace('%','').replace(',','.'));assert.equal(percent(row[4]),Number(expected.completionRatePercent.toFixed(2)));assert.equal(percent(row[5]),Number(expected.averageScorePercent.toFixed(2)));
    await ctx.evidence('export-content-check',{file,bytes:bytes.length,header:rows[headerIndex],row,expected});
  });},async ctx=>{const item=await ctx.pool.assignment('READING');const sub=await ctx.pool.submitted(item);await ctx.pool.get('teacher',`/submission-modules/${sub.submissionModuleId}/grading`);return{item};})
};