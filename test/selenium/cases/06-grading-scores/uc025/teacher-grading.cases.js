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
GRD_008:manual(async(ctx,ui,data)=>{await ctx.step('Yêu cầu AI phân tích bài Viết thật; kiểm tra gợi ý và quyền quyết định của giáo viên',async()=>{
    await ui.button(/^(Yêu cầu AI phân tích|Chấm bài bằng AI|Grade with AI|AI hỗ trợ chấm)$/i);
    await ctx.driver.wait(async()=>{const actual=await ctx.pool.get('teacher',`/gradings/${data.grading.id}`);return !!actual.aiFeedback;},90000,'Real AI response must be persisted');
    const actual=await ctx.pool.get('teacher',`/gradings/${data.grading.id}`);await ctx.evidence('ai-writing',actual);assert.ok(actual.aiFeedback);assert.notEqual(actual.status,'COMPLETED','AI suggestion must not finalize teacher grade');
    const suggestion=await aiSuggestion(ctx,data);await ctx.evidence('ai-suggestion',suggestion);
    assert.ok(Number.isFinite(suggestion.suggestedScore));
    await ui.has(new RegExp(`(?:Điểm AI đề xuất|AI Suggested(?: Score)?)\\s*:?\\s*${escapeRegex(suggestion.suggestedScore)}\\s*\\/\\s*10`,'i'));
    const annotation=suggestion.annotations?.find(a=>a.source==='AI'&&a.reviewStatus==='PENDING');
    if(!annotation)throw new Blocked('AI không tạo annotation cần duyệt trong bài mẫu này; chưa kiểm được nhánh Duyệt/Từ chối, không coi thiếu dữ liệu AI là nút UI hỏng.');
    const review=async(pattern,state)=>{
      const card=await ctx.driver.wait(()=>annotationCard(ctx,annotation),10000,'The persisted AI annotation must be visible without reloading');
      const actions=await card.findElements(By.css('button'));let target;
      for(const button of actions)if(pattern.test((await button.getText()).trim()))target=button;
      assert.ok(target,`Missing review action ${pattern} on the exact annotation`);assert.equal(await target.isEnabled(),true);
      await ctx.driver.executeScript('arguments[0].scrollIntoView({block:"center"})',target);await target.click();
      await ctx.driver.wait(async()=>(await aiSuggestion(ctx,data)).annotations?.some(a=>a.id===annotation.id&&a.reviewStatus===state),10000);
      const updated=await annotationCard(ctx,annotation);assert.match(await updated.getText(),state==='ACCEPTED'?/Đã duyệt|Accepted/i:/Đã từ chối|Rejected/i);
      await ctx.evidence(`annotation-${state}`,await aiSuggestion(ctx,data));
    };
    await review(/^Duyệt$|^Accept$/i,'ACCEPTED');await review(/^Từ chối$|^Reject$/i,'REJECTED');
    await grade(ctx,ui,data,6.5,'Teacher reviewed the AI suggestion.');
  });}),
GRD_009:manual(async(ctx,ui,data)=>{await ctx.step('Chặn request AI; UI phải báo lỗi và vẫn cho chấm thủ công',async()=>{await ctx.driver.sendDevToolsCommand('Network.enable',{});await ctx.driver.sendDevToolsCommand('Network.setBlockedURLs',{urls:['*api/v1/*/ai*','*api/v1/*/grade-ai*']});ctx.registerCleanup('Restore AI network requests',()=>ctx.driver.sendDevToolsCommand('Network.setBlockedURLs',{urls:[]}));await ui.button(/^(Yêu cầu AI phân tích|Chấm bài bằng AI|Grade with AI)$/i);await ui.error(/lỗi|không thể|tạm thời|error|failed|unavailable/i);await grade(ctx,ui,data,7,'Manual grading available while AI unavailable.');});}),
GRD_010:manual(async ctx=>{await ctx.step('Xác định tiêu chí phản hồi AI cho nội dung quá ngắn/khác ngôn ngữ',()=>{throw new Blocked('Excel yêu cầu phản hồi hợp lý nhưng không định nghĩa tiêu chí đánh giá. Cần bài mẫu 1 từ/tiếng Việt và oracle nội dung AI trước khi tự động kết luận.');});})
};