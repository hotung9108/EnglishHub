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
GRD_011:manual(async(ctx,ui,data)=>{await ctx.step('Phân tích bản ghi: đối chiếu transcript, phiên âm thực và điểm; không bắt literal chữ IPA',async()=>{
    await ui.button(/^(AI hỗ trợ đánh giá phát âm|Chấm bài bằng AI|Grade with AI)$/i);await ctx.driver.wait(async()=>!!(await ctx.pool.get('teacher',`/gradings/${data.grading.id}`)).aiTranscript,90000,'Speaking AI transcript');
    const actual=await ctx.pool.get('teacher',`/gradings/${data.grading.id}`);const suggestion=await aiSuggestion(ctx,data);await ctx.evidence('ai-speaking',{actual,suggestion});
    const parsed=JSON.parse(actual.aiTranscript);const transcript=Array.isArray(parsed.transcript)?parsed.transcript.map(w=>w.word).join(' '):parsed.transcript;
    assert.ok(transcript&&typeof transcript==='string');await ui.has(new RegExp(escapeRegex(transcript.split(/\s+/).slice(0,6).join(' '))));
    assert.ok(Number.isFinite(suggestion.suggestedScore));await ui.has(new RegExp(`(?:Điểm AI đề xuất|AI Suggested(?: Score)?)\\s*:?\\s*${escapeRegex(suggestion.suggestedScore)}\\s*\\/\\s*10`,'i'));
    const pronunciations=suggestion.annotations?.filter(a=>a.errorType==='PRONUNCIATION'&&/\/[^/]+\//u.test(a.suggestedFix??''))??[];
    if(!pronunciations.length)throw new Blocked('Bản ghi tổng hợp không tạo lỗi phát âm kèm phiên âm; cần dữ liệu AI có từ sai để kiểm phần IPA, không kết luận thiếu chức năng từ kết quả AI không có lỗi.');
    for(const annotation of pronunciations){const ipa=annotation.suggestedFix.match(/\/[^/]+\//u)[0];await ui.has(new RegExp(escapeRegex(ipa)));}
    assert.notEqual(actual.status,'COMPLETED');
  });},'SPEAKING')
};