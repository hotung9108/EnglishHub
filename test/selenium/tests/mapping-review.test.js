import test from 'node:test';
import assert from 'node:assert/strict';
import {scenarios as cases} from '../common/runner/registry.js';
const contracts={
  ASG_005:{objective:'create',skill:'READING',status:'PUBLISHED',questionType:'MULTIPLE_CHOICE'},
  ASG_006:{objective:'audio-upload-playback',skill:'LISTENING',format:'mp3'},
  ASG_007:{objective:'reject-audio-format',skill:'LISTENING',extension:'.exe'},
  ASG_008:{objective:'audio-size-boundary',skill:'LISTENING'},
  ASG_009:{objective:'required-title'},
  ASG_010:{objective:'attempt-limit',value:-1}
};
for(const [id,expected] of Object.entries(contracts))test(`${id} is wired to its documented objective`,()=>assert.deepEqual(cases[id].coverage,expected));
