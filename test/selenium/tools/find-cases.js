import {readFile} from 'node:fs/promises';
const catalog=JSON.parse(await readFile(new URL('../catalog/cases.json',import.meta.url),'utf8'));
const index=JSON.parse(await readFile(new URL('../catalog/case-index.json',import.meta.url),'utf8'));
const args=process.argv.slice(2);const role=args.find(a=>a.startsWith('--role='))?.slice(7);
const requirement=args.find(a=>a.startsWith('--requirement='))?.slice(14).toLowerCase();
const query=args.filter(a=>!a.startsWith('--')).join(' ').toLocaleLowerCase('vi');
const found=catalog.cases.filter(c=>{const row=index[c.id];return (!role||row.role===role)&&(!requirement||c.requirement.toLowerCase().includes(requirement))&&(!query||[c.id,c.title,c.requirement,row.sourceFile,c.expected].join(' ').toLocaleLowerCase('vi').includes(query));});
console.log(JSON.stringify({total:found.length,cases:found.map(c=>({id:c.id,title:c.title,requirement:c.requirement,...index[c.id]}))},null,2));
