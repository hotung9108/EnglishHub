export function parseOptions(args,cases) {
  const options={watch:false,observeMs:1800};let selector,selectors;
  for(const arg of args) {
    if(arg==='--watch')options.watch=true;
    else if(arg==='--list')options.list=true;
    else if(arg==='--check-only')options.checkOnly=true;
    else if(arg.startsWith('--case='))selector=arg.slice(7).trim();
    else if(arg.startsWith('--cases='))selectors=arg.slice(8).split(',').map(s=>s.trim());
    else if(arg.startsWith('--slow=')){options.observeMs=Number(arg.slice(7));if(!Number.isInteger(options.observeMs)||options.observeMs<0||options.observeMs>30000)throw new Error('--slow must be 0..30000 ms');}
    else throw new Error(`Unknown option: ${arg}`);
  }
  if(selector!==undefined&&selectors!==undefined)throw new Error('Use --case or --cases, not both');
  const normalize=value=>/^(?:QA31-)?\d{1,3}$/i.test(value)?`QA31-${String(Number(value.replace(/^QA31-/i,''))).padStart(3,'0')}`:value;
  const chosen=selectors??(selector!==undefined?[selector]:undefined);
  const ids=new Set();
  for(const value of chosen||[]) {
    const code=normalize(value),found=cases.find(t=>t.id===code||t.title.toLowerCase()===value.toLowerCase());
    if(!value||!found)throw new Error(`Không có case: ${value}. Dùng --list để xem mã đúng.`);
    ids.add(found.id);
  }
  options.selected=chosen?cases.filter(t=>ids.has(t.id)):cases;
  if(!options.selected.length)throw new Error(`Không có case: ${selector}. Dùng --list để xem mã đúng.`);
  return options;
}
export function classify(error,phase) {
  if(error.code==='QA31_SCOPE')return 'SCOPE_REVIEW';
  if(error.code==='QA31_HARNESS')return 'HARNESS_REVIEW';
  if(error.code==='QA31_FIXTURE')return 'FIXTURE_REVIEW';
  if(error.code==='QA31_BLOCKED')return 'PRODUCT_DEPENDENCY';
  if(error.code==='QA31_ENVIRONMENT'||phase==='driver'||phase==='preflight')return 'ENVIRONMENT_REVIEW';
  if(error.status===401)return 'API_AUTH_REVIEW';
  if(error.status===403)return 'API_ACCESS_REVIEW';
  if(phase==='login')return 'AUTH_REVIEW';
  if(error.code==='ERR_ASSERTION')return 'PRODUCT_CANDIDATE';
  return 'NEEDS_REVIEW';
}
