// Observation only: requests and responses pass through unchanged.
export const observerScript = `(()=>{
  window.__srsNetwork=[];try{window.__srsUiStates=JSON.parse(sessionStorage.getItem('__srsLoadingHistory')||'[]')}catch{window.__srsUiStates=[]}
  window.__srsErrors=[];addEventListener('error',e=>window.__srsErrors.push({message:e.message,filename:e.filename,line:e.lineno}));addEventListener('unhandledrejection',e=>window.__srsErrors.push({message:String(e.reason)}));
  const eligible=url=>String(url).includes('/api/v1/');
  const record=(method,url,status,text,start)=>{let body;try{body=JSON.parse(text)}catch{body=String(text).slice(0,4000)};const target=new URL(url,location.href);window.__srsNetwork.push({method,path:target.pathname,query:target.search,status,response:body,durationMs:Math.round(performance.now()-start),at:new Date().toISOString()})};
  const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(method,url,...rest){this.__srsRequest={method,url};return open.call(this,method,url,...rest)};
  XMLHttpRequest.prototype.send=function(...args){const req=this.__srsRequest,start=performance.now();if(req&&eligible(req.url))this.addEventListener('loadend',()=>{let text;try{text=this.responseType==='json'?JSON.stringify(this.response):this.responseText}catch{text='[binary]'}record(req.method,req.url,this.status,text,start)},{once:true});return send.apply(this,args)};
  const original=window.fetch.bind(window);window.fetch=async(...args)=>{const url=typeof args[0]==='string'?args[0]:args[0]?.url;const start=performance.now();const response=await original(...args);if(eligible(url))response.clone().text().then(text=>record(args[1]?.method||'GET',url,response.status,text,start));return response};
  const snapshot=()=>{const items=Array.from(document.querySelectorAll('button:disabled')).filter(e=>e.getClientRects().length).map(e=>({text:e.innerText.trim(),spinner:!!e.querySelector('.animate-spin'),disabled:e.disabled})).filter(e=>e.spinner||/Đang|Loading|Submitting|Saving|Signing/i.test(e.text));if(items.length){const state={at:new Date().toISOString(),route:location.pathname,buttons:items};if(JSON.stringify(items)!==JSON.stringify(window.__srsUiStates.at(-1)?.buttons)){window.__srsUiStates.push(state);try{sessionStorage.setItem('__srsLoadingHistory',JSON.stringify(window.__srsUiStates))}catch{}}}};
  addEventListener('DOMContentLoaded',()=>{new MutationObserver(snapshot).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});snapshot()});
})();`;
