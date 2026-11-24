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
SCR_004:manual(async(ctx,ui,data)=>{await ctx.step('Bấm lưu điểm điều chỉnh để mở hộp lý do; xác nhận rồi đọc lại điểm/lịch sử',async()=>{
    await grade(ctx,ui,data,5,'Initial feedback');await editor(ctx,ui,data);await ui.fill(score,7);await ui.button(save);await ui.visible(reason);await ui.fill(reason,'SRS review correction');await ui.button(/^Xác nhận & Cập nhật điểm$|^Confirm.*Update/i);
    await ctx.driver.wait(async()=>Number((await ctx.pool.get('teacher',`/gradings/${data.grading.id}`)).finalScore)===7,15000);
    const history=await ctx.pool.get('teacher',`/gradings/${data.grading.id}/change-logs`);await ctx.evidence('grade-history',history);
    assert.ok(history.data.some(e=>Number(e.oldScore)===5&&Number(e.newScore)===7&&e.note==='SRS review correction'));
  });}),
SCR_005:manual(async(ctx,ui,data)=>{await ctx.step('Điểm ngoài khoảng và lý do trống đều giữ nguyên điểm5; kiểm đúng bước hộp thoại',async()=>{
    await grade(ctx,ui,data,5);await editor(ctx,ui,data);const input=await ui.fill(score,-1);await ui.button(save);
    const validity=await ctx.driver.executeScript('return {valid:arguments[0].validity.valid,message:arguments[0].validationMessage}',input);
    if(!validity.valid)assert.ok(validity.message);else await ui.error(/điểm|score|range/i);
    assert.equal(Number((await ctx.pool.get('teacher',`/gradings/${data.grading.id}`)).finalScore),5);
    await ui.fill(score,6);await ui.button(save);await ui.visible(reason);const confirm=await ui.button(/^Xác nhận & Cập nhật điểm$|^Confirm.*Update/i,'body',false);
    assert.equal(await confirm.isEnabled(),false,'Missing reason must prevent confirming an adjustment');
    await ctx.evidence('missing-adjustment-reason',{confirmationDisabled:true,grading:await ctx.pool.get('teacher',`/gradings/${data.grading.id}`)});
    assert.equal(Number((await ctx.pool.get('teacher',`/gradings/${data.grading.id}`)).finalScore),5);
  });})
};