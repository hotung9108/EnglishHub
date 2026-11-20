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
GRD_014:scenario('student',async ctx=>{await ctx.step('Xác định quy ước so khớp đáp án Nghe',()=>{throw new Blocked('UC028 nói so với đáp án chuẩn nhưng không nêu trim/case folding. Excel ghi nhất quán với quy ước mà chưa cung cấp quy ước.');});})
};