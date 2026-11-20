import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { essay, attempts, assignmentCard, overview, start, answer, submit, verifySubmitted, saveQuizAnswers, student, record } from "../../../common/flows/support/student/attempts.js";

export const cases = {
DO_003:student(async(ctx,ui,{item})=>{await ctx.step('Nhập bài viết, lưu, reload; nội dung phải giữ nguyên',async()=>{await start(ctx,ui,item);await answer(ctx,ui,item,essay);await ui.button(/^Lưu bản nháp/);await ui.has(/Đã lưu|Saved/i);await ctx.driver.navigate().refresh();await ctx.driver.wait(async()=>await(await ui.visible('.writing-textarea')).getAttribute('value')===essay,10000,'Writing text must survive reload');const list=await attempts(ctx,item);assert.equal(list.length,1);assert.equal(list[0].status,'IN_PROGRESS');});}),
DO_004:student(async ctx=>{await ctx.step('Đối chiếu min/max số từ trước khi chạy biên',()=>{throw new Blocked('UC016 yêu cầu hiển thị word count limit nhưng không chốt min/max số từ; Excel cũng ghi xác nhận limit. Cần cấu hình bài mẫu có giới hạn được phê duyệt.');});}),
DO_005:student(async(ctx,ui,{item})=>{await ctx.step('Upload a.exe; phải báo sai định dạng và không lưu file',async()=>{await start(ctx,ui,item);const file=join(ctx.output,'a.exe');await writeFile(file,'SRS invalid file fixture, not executable');await(await ctx.driver.findElement(By.css('input[type=file]'))).sendKeys(file);await ui.error(/định dạng|không hỗ trợ|unsupported|format|PDF|DOCX/i);const detail=await ctx.pool.get('student',`/submissions/${(await attempts(ctx,item))[0].id}`);await ctx.evidence('invalid-upload-readback',detail);for(const m of detail.modules??[]){assert.equal(m.status,'IN_PROGRESS');const stored=await ctx.pool.request('student','GET',`/submission-modules/${m.id}`,undefined,{allowError:true});await ctx.evidence('invalid-upload-module',stored);if(stored.status===200){for(const a of stored.data.answers??[])assert.ok(!a.docStorageKey)}else assert.equal(stored.status,400)}const network=await ctx.driver.executeScript('return window.__srsNetwork||[]');assert.equal(network.filter(r=>r.method==='POST'&&r.path.endsWith('/document-upload-url')).length,0);});})
};