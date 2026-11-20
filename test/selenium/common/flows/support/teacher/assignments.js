import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { scenario, UI } from "../../../ui/ui.js";

import { Blocked } from "../../../runner/core.js";

import { businessDateTime } from "../../../time.js";

import {writeFile} from 'node:fs/promises';

import {join} from 'node:path';

import {fileURLToPath} from 'node:url';

const prompt={WRITING:'textarea[placeholder="Nhập chủ đề đề bài, ngữ cảnh và câu hỏi chỉ thị..."],textarea[placeholder="Enter prompt statement..."]',SPEAKING:'textarea[placeholder*="Describe a memorable"],textarea[placeholder*="Mô tả"]',READING:'input[placeholder="THE EVOLUTION OF PRINTING & TYPOGRAPHY"],input[placeholder*="RENEWABLE ENERGY"]',LISTENING:'textarea[placeholder^="Nhập nội dung lời thoại"],textarea[placeholder^="Enter audio transcript"],textarea[placeholder^="Nhập lời thoại nghe"],textarea[placeholder^="Paste transcript"]'};

async function reserve(ctx) {const title=`${ctx.pool.prefix}-UI-${Date.now()}`;const resource={type:'assignment',title,classId:ctx.pool.class.id,owner:'teacher',state:'RESERVED'};ctx.pool.resources.push(resource);await ctx.pool.journal();return resource;}

async function form(ctx,ui,resource,skill='WRITING') {
  await ui.nav('/teacher/classes');await ui.button(/^(Giao bài tập mới|Create Assignment)$/i);await ui.path('/teacher/assignments/create');
  await ui.select('.assignment-edit-header select',ctx.pool.class.id);
  await ui.fill('.assignment-edit-title-input',resource.title);
  if(skill!=='WRITING'){
    await ui.button(/^(Thêm module|Add Module)$/i);
    await ui.button(new RegExp(`^Thêm phần .*\\(${skill[0]+skill.slice(1).toLowerCase()}\\)$|^Add ${skill[0]+skill.slice(1).toLowerCase()} Module$`));
    await ctx.driver.actions().move({origin:await ui.visible('.tae-module-chip.skill-writing')}).perform();
    await(await ui.visible('.tae-module-chip.skill-writing button.delete')).click();
    assert.equal((await ctx.driver.findElements(By.css('.tae-module-chip'))).length,1,'Only requested skill may remain');
  }
  await ui.fill(prompt[skill],`SRS ${skill} content for daily practice`);
  const dates=await ctx.driver.findElements(By.css('main input[type=datetime-local]'));assert.equal(dates.length,2);
  for(const [i,offset] of [[0,-1],[1,7]])await ui.date(dates[i],businessDateTime(offset));
}

async function created(ctx,resource,status,skill,{mcq=false}={}) {
  const list=await ctx.pool.get('teacher',`/classes/${ctx.pool.class.id}/assignments?limit=100`);
  const matches=list.data.filter(a=>a.title===resource.title);assert.equal(matches.length,1,'Exactly one new assignment must persist');
  Object.assign(resource,{id:matches[0].id,state:'CREATED'});await ctx.pool.journal();
  const detail=await ctx.pool.get('teacher',`/assignments/${resource.id}`);await ctx.evidence('assignment-readback',detail);assert.equal(detail.status,status);assert.equal(detail.id,matches[0].id,'Created assignment must belong to the class-scoped list');
  const modules=await ctx.pool.get('teacher',`/assignments/${resource.id}/modules`);assert.equal(modules.data.length,1);assert.equal(modules.data[0].skill,skill);
  const module=await ctx.pool.get('teacher',`/modules/${modules.data[0].id}`);await ctx.evidence('module-readback',module);assert.ok(module.instructions?.includes(`SRS ${skill} content for daily practice`),'Skill instructions must persist exactly');
  if(skill==='LISTENING'){assert.equal(module.sourceAudioUploadStatus,'READY');assert.ok(module.sourceAudioStorageKey);}
  if(['READING','LISTENING'].includes(skill)){
    const questions=await ctx.pool.get('teacher',`/modules/${module.id}/questions`);await ctx.evidence('questions-readback',questions);assert.equal(questions.data.length,1);assert.equal(questions.data[0].content,skill==='READING'?'Which fruit is mentioned?':'Which fruit?');
    if(mcq){assert.equal(questions.data[0].questionType,'MULTIPLE_CHOICE');assert.ok(questions.data[0].correctAnswer?.options?.some(o=>o.content==='apple'&&o.isCorrect));assert.equal(Number(questions.data[0].score),10);assert.equal(Number(module.maxScore),10);}
    else assert.equal(questions.data[0].correctAnswer?.correctAnswer,'apple');
  }
  return detail;
}

async function openAssignment(ctx,ui,item) {
  await ui.nav('/teacher/assignments');await ui.select('.teacher-hero-actions select',item.classId??ctx.pool.class.id);await ui.ready();await ui.fill('input.teacher-search-input',item.title);
  let card;await ctx.driver.wait(async()=>{for(const c of await ctx.driver.findElements(By.css('.teacher-assignment-card')))if((await c.getText()).includes(item.title)){card=c;return true;}return false;},10000,`Assignment ${item.title} must appear`);
  await (await card.findElement(By.css('h3'))).click();await ui.path(`/teacher/assignments/${item.id}`);await ui.has(new RegExp(item.title));
}

async function publishDraft(ctx,ui,item){
  await openAssignment(ctx,ui,item);await ui.button(/^(Chỉnh sửa bài tập|Edit Assignment)$/i);await ui.visible('.assignment-edit-title-input');await ui.button(/^(Xuất bản bài tập|Publish)$/i);
}

const teacher=(run,prepare)=>scenario('teacher',run,prepare);

const fixture=options=>async(ctx)=>({item:await ctx.pool.assignment('WRITING',options)});

const creation=(skill,publish=false,options={})=>Object.assign(teacher(async(ctx,ui)=>{
  const resource=await reserve(ctx);
  await ctx.step(`Mở form, nhập dữ liệu ${skill}`,async()=>{
    await form(ctx,ui,resource,skill);
    if(skill==='READING'){
      const paragraphs=await ctx.driver.findElements(By.css('textarea[placeholder^="Dán hoặc gõ nội dung bài đọc"],textarea[placeholder^="Paste or type reading"],textarea[placeholder^="Nhập nội dung văn bản"],textarea[placeholder^="Enter text for Paragraph"],textarea[placeholder^="Nhập nội dung bài đọc"],textarea[placeholder^="Enter reading"]'));
      if(!paragraphs.length)await ui.button(/^(Thêm đoạn văn mới|Add Paragraph)$/i);
      await ui.fill('textarea[placeholder^="Dán hoặc gõ nội dung bài đọc"],textarea[placeholder^="Paste or type reading"],textarea[placeholder^="Nhập nội dung văn bản"],textarea[placeholder^="Enter text for Paragraph"],textarea[placeholder^="Nhập nội dung bài đọc"],textarea[placeholder^="Enter reading"]','Daily practice improves vocabulary. An apple is a fruit.');
      await ui.button(options.mcq?/^Trắc nghiệm$|^Multiple Choice$/i:/Điền từ|Short Answer|Gap Fill/i);
      await ui.fill('input[placeholder="Enter question statement..."],input[placeholder="Nhập nội dung câu hỏi..."]','Which fruit is mentioned?');
      if(options.mcq){
        const observedInputs=[];
        for(const [i,letter] of ['A','B','C','D'].entries()){
          const requested=['apple','banana','orange','pear'][i];const field=await ui.fill(`input[placeholder^="Lựa chọn ${letter}"],input[placeholder^="Option ${letter}"]`,requested);
          observedInputs.push({letter,requested,actualAfterChange:await field.getAttribute('value')});
        }
        await ctx.evidence('mcq-input-observations',observedInputs);
        await(await ui.visible('.question-option-row input[type=radio]')).click();
        await ui.fill('input.tae-meta-score-input',10);
        assert.equal(await(await ui.visible('input.tae-meta-score-input')).getAttribute('value'),'10','The actual fixture score must remain exactly10');
      }else await ui.fill('input[placeholder$="renewable energy"],input[placeholder="e.g. dummy text"],input[placeholder*="Nhập đáp án đúng"]','apple');
    }
    if(skill==='LISTENING'){
      const audioFile=options.mp3?fileURLToPath(new URL("../../../../fixtures/srs/valid-tone.mp3",import.meta.url)):await ctx.pool.wav();
      await (await ctx.driver.findElement(By.css('input[type=file]'))).sendKeys(audioFile);
      if(options.mp3){
        await ctx.driver.wait(()=>ctx.driver.executeScript('return Array.from(document.querySelectorAll("audio")).some(a=>a.readyState>=1&&a.duration>0&&Number.isFinite(a.duration))'),15000,'MP3 must load with finite duration');
        await ctx.driver.executeScript('const a=document.querySelector("audio");a.muted=true;return a.play()');
        await ctx.driver.wait(()=>ctx.driver.executeScript('return Array.from(document.querySelectorAll("audio")).some(a=>!a.paused&&a.currentTime>0)'),10000,'MP3 playback must advance');
        await ctx.evidence('mp3-playback',await ctx.driver.executeScript('const a=document.querySelector("audio");return {duration:a.duration,currentTime:a.currentTime,paused:a.paused,readyState:a.readyState}'));
      }
      await ui.button(/^(Thêm câu hỏi mới|Add Question|Điền từ \/ Ngắn|Short Answer)$/i);
      await ui.fill('input[placeholder^="Enter question text"],input[placeholder^="Nhập nội dung câu hỏi"]','Which fruit?');
      await ui.fill('input[placeholder$="Central Park"]','apple');
    }
  });
  await ctx.step(publish?'Xuất bản, kiểm tra danh sách và API':'Lưu nháp, kiểm tra danh sách và API',async()=>{
    await ui.button(publish?/^(Giao bài tập|Create & Publish)$/i:/^(Lưu bản nháp|Save Draft)$/i);await ui.path('/teacher/assignments');
    await created(ctx,resource,publish?'PUBLISHED':'DRAFT',skill,options);await ctx.driver.navigate().refresh();await ui.visible('.teacher-hero-actions select');await ui.select('.teacher-hero-actions select',ctx.pool.class.id);await ui.fill('input.teacher-search-input',resource.title);await ui.has(new RegExp(resource.title));
  });
  if(publish)await ctx.step('Học viên trong lớp thấy đúng bài đã xuất bản và module Reading',async()=>{await ui.login('student');await ui.nav('/student/assignments');await ui.fill('main input[type=text]',resource.title);await ui.has(new RegExp(resource.title));const data=await ctx.pool.get('student',`/assignments/${resource.id}`);assert.equal(data.status,'PUBLISHED');const modules=await ctx.pool.get('student',`/assignments/${resource.id}/modules`);assert.deepEqual(modules.data.map(m=>m.skill),[skill]);await ctx.evidence('student-visible-published-assignment',data);});
}),{coverage:{objective:options.mp3?'audio-upload-playback':'create',skill,...(options.mp3?{format:'mp3'}:{status:publish?'PUBLISHED':'DRAFT',...(options.mcq?{questionType:'MULTIPLE_CHOICE'}:{})})}});

const withCoverage=(coverage,procedure)=>Object.assign(procedure,{coverage});

const requiredTitle=()=>withCoverage({objective:'required-title'},teacher(async(ctx,ui)=>{
  const resource=await reserve(ctx);
  await ctx.step('Bỏ trống tiêu đề, bấm Lưu bản nháp; kiểm lỗi bắt buộc và không có bài được tạo',async()=>{
    await form(ctx,ui,resource);const field=await ui.fill('.assignment-edit-title-input','');await ui.button(/^(Lưu bản nháp|Save Draft)$/i);
    const validation=await ctx.driver.executeScript('return {missing:arguments[0].validity.valueMissing,message:arguments[0].validationMessage,value:arguments[0].value}',field);
    await ctx.evidence('required-title-validation',validation);
    if(validation.missing)assert.ok(validation.message);else await ui.error(/tiêu đề.*trống|tiêu đề.*bắt buộc|title.*empty|title.*required/i);
    await ui.path('/teacher/assignments/create');const list=await ctx.pool.get('teacher',`/classes/${ctx.pool.class.id}/assignments?limit=100`);assert.equal(list.data.filter(a=>a.title===resource.title).length,0);
  });
}));

const attemptLimit=value=>withCoverage({objective:'attempt-limit',value},teacher(async(ctx,ui)=>{
  const resource=await reserve(ctx);
  await ctx.step(`Nhập số lần làm tối đa ${value}, bấm Lưu và kiểm lỗi số nguyên ≥1`,async()=>{
    await form(ctx,ui,resource);const field=await ui.fill('input[type=number][placeholder="1"]',value);const actual=await field.getAttribute('value');await ctx.evidence('attempt-input',{requested:value,actual});
    if(actual!==String(value))throw new Blocked(`Ô nhập chuẩn hóa ${value} thành ${actual}; chưa đưa được giá trị âm/0 qua bước Lưu. Không dùng một giá trị khác để kết luận ca này đạt hoặc sản phẩm có lỗi.`);
    await ui.button(/^(Lưu bản nháp|Save Draft)$/i);await ui.error(/số lần|ít nhất 1|greater|minimum|submissions/i);await ui.path('/teacher/assignments/create');
    const list=await ctx.pool.get('teacher',`/classes/${ctx.pool.class.id}/assignments?limit=100`);assert.equal(list.data.filter(a=>a.title===resource.title).length,0);
  });
}));

export { prompt, reserve, form, created, openAssignment, publishDraft, teacher, fixture, creation, withCoverage, requiredTitle, attemptLimit };
