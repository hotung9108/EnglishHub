import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { writeFile } from 'node:fs/promises';

import { join } from 'node:path';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { essay, attempts, assignmentCard, overview, start, answer, submit, verifySubmitted, saveQuizAnswers, student, record } from "../../../common/flows/support/student/attempts.js";

export const cases = {
DO_013:student(async(ctx,ui,{item})=>{await ctx.step('Làm bài Đọc, bấm Nộp và Xác nhận',async()=>{await start(ctx,ui,item);await answer(ctx,ui,item);await submit(ctx,ui,item,{confirm:true});});await ctx.step('Kiểm tra thời gian nộp và chuyển đúng trang kết quả',async()=>{const detail=await verifySubmitted(ctx,item);await ui.path(`/student/submissions/${detail.id}`);});},'READING'),
DO_014:student(async(ctx,ui,{item})=>{await ctx.step('Bấm Nộp rồi Hủy; câu trả lời và trạng thái chưa nộp phải giữ',async()=>{await start(ctx,ui,item);await answer(ctx,ui,item);await submit(ctx,ui,item,{confirm:false});await ui.confirm(false);assert.equal(await(await ui.visible('.exam-short-answer-input')).getAttribute('value'),'apple');const list=await attempts(ctx,item);assert.equal(list.length,1);assert.equal(list[0].status,'IN_PROGRESS');});},'READING'),
DO_015:student(async(ctx,ui,{item})=>{await ctx.step('Double click Nộp; chỉ được tạo một bài nộp và dùng một lượt',async()=>{await start(ctx,ui,item);await answer(ctx,ui,item);const submitButton=await ui.button(/^Hoàn thành & Nộp/i,'main',false);await ctx.driver.actions().doubleClick(submitButton).perform();if((await ctx.driver.findElements(By.css('[role=dialog],.tad-modal-overlay,.modal-overlay'))).length)await ui.confirm(true);await verifySubmitted(ctx,item);assert.equal((await attempts(ctx,item)).length,1);});},'READING'),
DO_016:student(async(ctx,ui,{item})=>{await ctx.step('Nhập nội dung và ngắt mạng bằng CDP trước khi nộp',async()=>{await start(ctx,ui,item);await answer(ctx,ui,item,essay);await ctx.driver.sendDevToolsCommand('Network.enable',{});ctx.registerCleanup('Restore network',()=>ctx.driver.sendDevToolsCommand('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1}));await ctx.driver.sendDevToolsCommand('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await ui.button(/^Nộp bài/i);if((await ctx.driver.findElements(By.css('[role=dialog],.tad-modal-overlay,.modal-overlay'))).length)await ui.confirm(true);await ui.error(/mạng|kết nối|network|connection/i);assert.equal(await(await ui.visible('.writing-textarea')).getAttribute('value'),essay);});await ctx.step('Khôi phục mạng; gửi lại phải giữ nội dung và chỉ nộp một lần',async()=>{await ctx.driver.sendDevToolsCommand('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await submit(ctx,ui,item);await verifySubmitted(ctx,item);});}),
DO_018:student(async(ctx,ui,{item})=>{await ctx.step('Nộp Reading; số lần tăng đúng một và có điểm tự động',async()=>{await start(ctx,ui,item);await answer(ctx,ui,item);await submit(ctx,ui,item);const detail=await verifySubmitted(ctx,item);assert.equal((await attempts(ctx,item)).length,1);const grading=await ctx.pool.get('teacher',`/submission-modules/${detail.modules[0].id}/grading`);await ctx.evidence('auto-grade',grading);assert.equal(Number(grading.finalScore),10);});},'READING')
};