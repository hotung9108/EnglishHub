import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { scenario, UI } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { businessDateTime } from "../../../common/time.js";

import {writeFile} from 'node:fs/promises';

import {join} from 'node:path';

import {fileURLToPath} from 'node:url';

import { prompt, reserve, form, created, openAssignment, publishDraft, teacher, fixture, creation, withCoverage, requiredTitle, attemptLimit } from "../../../common/flows/support/teacher/assignments.js";

export const cases = {
ASG_004:creation('WRITING'),
ASG_005:creation('READING',true,{mcq:true}),
ASG_006:creation('LISTENING',false,{mp3:true}),
ASG_007:withCoverage({objective:'reject-audio-format',skill:'LISTENING',extension:'.exe'},teacher(async(ctx,ui)=>{const resource=await reserve(ctx);await ctx.step('Chọn bài Nghe, upload file .exe vô hại; phải từ chối và không gửi audio-upload',async()=>{await form(ctx,ui,resource,'LISTENING');const file=join(ctx.output,'invalid-audio.exe');await writeFile(file,'This is plain text for a negative upload test, not executable code.');const before=await ctx.driver.executeScript('return (window.__srsNetwork||[]).length');await(await ctx.driver.findElement(By.css('input[type=file]'))).sendKeys(file);await ui.has(/định dạng|không hỗ trợ|unsupported|format|âm thanh không hợp lệ|invalid audio|Vui lòng chọn tệp âm thanh hợp lệ|valid audio file/i,'body');const requests=await ctx.driver.executeScript('return (window.__srsNetwork||[]).slice(arguments[0])',before);assert.equal(requests.filter(r=>r.method==='POST'&&/\/audio(?:\/|$)/.test(r.path)).length,0);await ctx.evidence('rejected-exe-audio',{fileName:'invalid-audio.exe',requests});});})),
ASG_008:withCoverage({objective:'audio-size-boundary',skill:'LISTENING'},teacher(async ctx=>{await ctx.step('Đối chiếu ngưỡng byte được phê duyệt để upload limit-1, limit, limit+1',()=>{throw new Blocked('UC012 yêu cầu chặn file quá dung lượng nhưng PDF Group-04 và file đã chốt không nêu ngưỡng byte tối đa cho audio. Chưa đủ dữ liệu chạy biên limit-1/limit/limit+1; không tự lấy ngưỡng từ code làm đặc tả.');});})),
ASG_009:requiredTitle(),
ASG_010:attemptLimit(-1),
ASG_011:attemptLimit(0),
ASG_014:teacher(async ctx=>{await ctx.step('Đối chiếu giới hạn trên của số lần làm',()=>{throw new Blocked('Excel cho phép chấp nhận 1000 hoặc báo giới hạn; SRS không quy định max. Cần oracle chính thức để đánh giá ca biên.');});}),
ASG_015:teacher(async ctx=>{await ctx.step('Đối chiếu quy tắc điểm tối đa',()=>{throw new Blocked('Excel ghi chỉ chấp nhận giá trị hợp lệ nhưng chưa định nghĩa quy tắc cho 0/0.5/1000. UC012 không chốt giới hạn này.');});}),
ASG_016:teacher(async(ctx,ui)=>{const r=await reserve(ctx);await ctx.step('Đặt hạn nộp quá khứ; xuất bản phải bị từ chối',async()=>{await form(ctx,ui,r);const fields=await ctx.driver.findElements(By.css('input[type=datetime-local]'));await ui.date(fields[0],businessDateTime(-3));await ui.date(fields[1],businessDateTime(-1));await ui.button(/^(Giao bài tập|Create & Publish)$/i);await ui.error(/hạn|deadline|quá khứ|past/i);await ui.path('/teacher/assignments/create');});})
};

for(const [id,count] of [['ASG_012',1],['ASG_013',2]])cases[id]=teacher(async(ctx,ui)=>{const r=await reserve(ctx);await ctx.step(`Tạo nháp với số lần tối đa ${count}; đọc lại đúng số`,async()=>{await form(ctx,ui,r);await ui.fill('input[type=number][placeholder="1"]',count);await ui.button(/^(Lưu bản nháp|Save Draft)$/i);await ui.path('/teacher/assignments');const actual=await created(ctx,r,'DRAFT','WRITING');assert.equal(actual.maxSubmissions,count);});});