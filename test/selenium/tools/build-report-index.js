import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {buildReportIndex} from '../common/runner/report-catalog.js';
assert.equal(process.argv.length,2,'No arguments supported; this command only indexes existing reports.');
const result=await buildReportIndex({root:fileURLToPath(new URL('../reports/',import.meta.url)),catalogPath:fileURLToPath(new URL('../catalog/cases.json',import.meta.url))});
console.log(JSON.stringify({...result,index:'reports/index.html',execution:'NONE; existing results unchanged'}));
