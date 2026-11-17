import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { essay, attempts, assignmentCard, overview, start, answer, submit, verifySubmitted, saveQuizAnswers, student, record } from "../../../common/flows/support/student/attempts.js";

export const cases = {
DO_006:student(async(ctx,ui,{item})=>{await ctx.step('Ghi âm thật từ micro giả và nghe lại',async()=>{await start(ctx,ui,item);await record(ctx,ui);await ui.button(/^(Phát lại bản ghi|Phát|Nghe lại|Play|Play Recording)$/i);await ctx.driver.wait(()=>ctx.driver.executeScript('return Array.from(document.querySelectorAll("audio")).some(a=>!a.paused&&a.currentTime>0)'),10000);});await ctx.step('Lưu bản ghi; API phải có audio READY gắn đúng bài',async()=>{await ui.button(/^Nộp bài Nói|^Lưu bản ghi|^Save Recording/i);const details=await verifySubmitted(ctx,item);const stored=await ctx.pool.get('student',`/submission-modules/${details.modules.find(m=>m.moduleId===item.moduleId).id}`);await ctx.evidence('audio-storage-readback',stored);assert.ok(stored.answers?.some(a=>a.audioStorageKey&&a.audioUploadStatus==='READY'));});},'SPEAKING'),
DO_007:student(async(ctx,ui,{item})=>{await ctx.step('Ghi, hủy bản tạm rồi ghi lại; bản mới thay thế bản cũ',async()=>{await start(ctx,ui,item);await record(ctx,ui);const first=await ctx.driver.executeScript('return document.querySelector("audio").src');await ui.button(/^(Thu âm lại từ đầu|Ghi âm lại|Hủy bản ghi|Record Again|Re-record)$/i);await record(ctx,ui);const second=await ctx.driver.executeScript('return document.querySelector("audio").src');assert.notEqual(first,second);assert.equal((await attempts(ctx,item)).length,1);});},'SPEAKING'),
DO_008:student(async(ctx,ui,{item})=>{await ctx.step('Chặn micro bằng quyền trình duyệt; ứng dụng phải nhắc cấp quyền',async()=>{await ctx.driver.sendDevToolsCommand('Browser.setPermission',{permission:{name:'microphone'},setting:'denied',origin:new URL(ctx.baseUrl).origin});await start(ctx,ui,item);await(await ui.visible('.speaking-btn-record')).click();await ui.has(/quyền.*micro|micro.*quyền|microphone.*permission|permission.*microphone/i);assert.equal(await ctx.driver.executeScript('return !!document.querySelector("audio")?.src'),false);});},'SPEAKING')
};