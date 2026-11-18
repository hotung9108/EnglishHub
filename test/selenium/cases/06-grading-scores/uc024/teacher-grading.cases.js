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
GRD_001:manual(async(ctx,ui,data)=>{await ctx.step('Nhập điểm hợp lệ và nhận xét; lưu, mở lại và đối chiếu',async()=>{await grade(ctx,ui,data,7.5,'Good progress. Practice vocabulary.');await editor(ctx,ui,data);assert.equal(Number(await(await ui.visible(score)).getAttribute('value')),7.5);assert.equal(await(await ui.visible(feedback)).getAttribute('value'),'Good progress. Practice vocabulary.');});}),
GRD_006:manual(async(ctx,ui,data)=>{await ctx.step('Nhập abc vào điểm; không được cập nhật điểm chính thức',async()=>{await ui.fill(score,'abc');const value=await(await ui.visible(score)).getAttribute('value');assert.equal(value,'','Numeric input must refuse letters');await ui.button(save);await ui.error(/điểm|score|number|số/i);const actual=await ctx.pool.get('teacher',`/gradings/${data.grading.id}`);assert.notEqual(actual.status,'COMPLETED');assert.equal(actual.finalScore,null);});}),
GRD_007:manual(async ctx=>{await ctx.step('Xác định quy tắc nhận xét bắt buộc',()=>{throw new Blocked('Excel Expected Result ghi hành vi theo quy định (ghi nhận); UC024 chưa chốt nhận xét trống có được lưu không.');});})
};

for(const [id,value,valid] of [['GRD_002',-0.1,false],['GRD_003',0,true],['GRD_004',10,true],['GRD_005',10.1,false]])cases[id]=manual(async(ctx,ui,data)=>{await ctx.step(`Chấm ${value}/10; đối chiếu validation và dữ liệu lưu`,async()=>{const before=await ctx.pool.get('teacher',`/gradings/${data.grading.id}`);if(valid){await grade(ctx,ui,data,value);await editor(ctx,ui,data);assert.equal(Number(await(await ui.visible(score)).getAttribute('value')),value);}else{await ui.fill(score,value);await ui.fill(feedback,'Good');await ui.button(save);await ui.error(/điểm|score|range|0.*10/i);const after=await ctx.pool.get('teacher',`/gradings/${data.grading.id}`);assert.equal(after.status,before.status);assert.equal(after.finalScore,before.finalScore);}});});