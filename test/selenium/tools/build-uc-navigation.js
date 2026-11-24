import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const catalog=await read('catalog/cases.json');
const index=await read('catalog/case-index.json');
const qase=await read('integrations/qase/uc-layout.json');
const groups=[['01-auth-profile','Xác thực và hồ sơ',1,3],['02-users-permissions','Tài khoản và phân quyền',4,7],['03-classes-members','Lớp học và thành viên',8,10],['04-assignments','Quản lý bài tập',11,14],['05-attempts-submissions','Làm bài và nộp bài',15,23],['06-grading-scores','Chấm bài và điểm số',24,30],['07-results-reports','Kết quả và báo cáo',31,35]];
let toc='# Mục lục Selenium theo chức năng và UC\n\n170 mã: 168 procedure, 2 ca ngoài phạm vi. Case nhiều UC chỉ đặt ở UC đầu tiên; các tham chiếu khác giữ trong catalog. Vai trò được lọc bằng `npm run find -- --role=teacher`; tra UC bằng `npm run find -- --requirement=UC012`.\n\n';
for(const [folder,title,lo,hi] of groups){toc+=`## ${title}\n\n`;for(let n=lo;n<=hi;n++){
 const uc=`UC${String(n).padStart(3,'0')}`,dir=`cases/${folder}/${uc.toLowerCase()}`;
 const name=catalog.specs[uc].text.match(/Tên Use case\s*\n([^\n]+)/)?.[1]||uc;
 const entries=catalog.cases.filter(c=>c.requirement.match(/UC\d{3}/)?.[0]===uc&&!c.scopeExclusion);
 await mkdir(new URL(dir+'/',root),{recursive:true});
 let page=`# ${uc} — ${name}\n\nSuite Qase: ${qase.ucSuites[uc]}.\n\n| Case | Nội dung | Vai trò fixture | Source | Qase |\n|---|---|---|---|---|\n`;
 for(const c of entries){const row=index[c.id],file=row.sourceFile.split('/').at(-1);page+=`| ${c.id} | ${c.title.replaceAll('|','\\|')} | ${row.role} | [${file}](${file}) | EAM-${row.qaseCaseId} |\n`;}
 if(!entries.length)page+='\nChưa có procedure thuộc UC này trong bộ 170.\n';
 await writeFile(new URL(dir+'/README.md',root),page);
 toc+=`- [${uc} — ${name}](${folder}/${uc.toLowerCase()}/README.md): ${entries.length} ca.\n`;
}}
toc+='\n## NFR\n\n9 ca tại [08-nfr/nfr.cases.js](08-nfr/nfr.cases.js).\n\n## Ngoài phạm vi\n\nDO_017 và GRD_012 giữ trong catalog với scope exclusion; không có procedure.\n\n## Dữ liệu và code dùng chung\n\n`common/flows/`, `common/ui/`, `common/fixtures/` và `common/runner/`. `catalog/source-migration.json` ghi đường dẫn cũ → mới. Không chỉnh expected trong đợt sắp xếp.\n';
await writeFile(new URL('cases/README.md',root),toc);
await writeFile(new URL('integrations/qase/UC-NAVIGATION.md',root),'# Điều hướng theo UC\n\nCode đã chia theo cùng nhóm chức năng và UC trên Qase. Xem [mục lục source](../../cases/README.md), [chỉ mục 170 ca](../../catalog/case-index.csv) và `uc-layout.json` để tra ID suite.\n\n168 procedure, 2 ca ngoài phạm vi; ID Qase giữ nguyên. Đây là sắp xếp thư mục, chưa duyệt chất lượng nội dung case. Lượt đọc lại toàn bộ Qase sau chuyển UC trước đó chưa hoàn tất do phản hồi chậm.\n');
console.log('Built navigation for 35 UCs and NFR; no Qase writes.');
