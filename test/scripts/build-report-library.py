"""Offline report index. Original reports remain in place; no network or test execution."""
import csv, hashlib, html, json, os, pathlib, re
from collections import Counter
from datetime import datetime, timezone

REPO = pathlib.Path(__file__).resolve().parents[2]
OUT = REPO / 'test/reports'
ROOTS = ['production_artifacts/test_reports', 'test/selenium/reports', 'test/manual/reports', 'test/api', 'test/archive', '../../outputs/TSR_ENGLISHHUB_2026-11-14']
EXT = {'.html', '.htm', '.pdf', '.csv', '.xml', '.log', '.md', '.json'}

def main():
    (OUT/'catalog').mkdir(parents=True, exist_ok=True)
    records = []
    for scope in ROOTS:
        start = REPO/scope
        if not start.exists(): continue
        for base, dirs, files in os.walk(start, followlinks=False):
            dirs[:] = [d for d in dirs if d not in {'node_modules', 'tmp', '.git', '__pycache__', 'screenshots', 'images'} and not d.startswith('.') and not (getattr((pathlib.Path(base)/d).lstat(), 'st_file_attributes', 0)&0x400)]
            for name in files:
                p = pathlib.Path(base)/name
                if p.suffix.lower() not in EXT: continue
                if re.search(r'environment|fixture|credential|token|cookie|execution\.json|storage.?state', name, re.I): continue
                rel = pathlib.Path(os.path.relpath(p, REPO)).as_posix()
                # API source is not a report; include only output/report-looking files.
                if scope in {'test/api', 'test/archive'} and not re.search(r'report|summary|result|audit|verification|junit|surefire', rel, re.I): continue
                data = p.read_bytes()
                category = 'workspace-tsr' if scope.startswith('../../outputs/') else 'archive' if scope=='test/archive' else 'selenium' if scope=='test/selenium/reports' else 'manual' if scope=='test/manual/reports' else 'api' if scope=='test/api' else 'handoff'
                records.append({'category':category,'path':rel,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'fileModifiedAt':datetime.fromtimestamp(p.stat().st_mtime, timezone.utc).isoformat(),'sameContentAs':None})
    groups = {}
    for r in sorted(records,key=lambda x:x['path']):
        if r['sha256'] in groups: r['sameContentAs']=groups[r['sha256']]
        else: groups[r['sha256']]=r['path']
    payload={'generatedAt':datetime.now(timezone.utc).isoformat(),'roots':ROOTS,'note':'File modification time is not execution time. Entries are artifacts, not distinct runs/cases. Index excludes likely private files but linked originals are not sanitized.','counts':dict(Counter(r['category'] for r in records)),'files':records}
    (OUT/'catalog/artifacts.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
    with (OUT/'catalog/artifacts.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(records[0]) if records else ['path']);w.writeheader();w.writerows(records)
    rows=[]
    for r in records:
        link='../../'+r['path']; rows.append('<tr><td>'+html.escape(r['category'])+'</td><td><a href="'+html.escape(link,quote=True)+'">'+html.escape(r['path'])+'</a></td><td>'+str(r['bytes'])+'</td><td>'+('Bản trùng nội dung' if r['sameContentAs'] else '')+'</td></tr>')
    page='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kho báo cáo kiểm thử EnglishHub</title><style>body{font:16px system-ui;margin:32px;color:#17243a}input{padding:12px;width:75%;margin:16px 0}table{border-collapse:collapse;width:100%}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left;overflow-wrap:anywhere}tr[hidden]{display:none}a{color:#1857a4}nav a{margin-right:20px}</style><h1>Kho báo cáo kiểm thử EnglishHub</h1><p>Tra cứu tệp lịch sử; mỗi dòng là một tệp, không phải một lượt test. Ngày sửa tệp không được dùng làm ngày chạy. Bản trùng vẫn được giữ nguyên.</p><nav><a href="../selenium/reports/index.html">Chi tiết Selenium</a><a href="plans/RECOVERY_PLAN_2026-11-18.md">Kế hoạch sáng 18/11</a><a href="summaries/TSR_2026-11-17_DRAFT.md">Test Summary Report dự thảo</a><a href="history/timeline.csv">Lịch sử truy vết</a></nav><p>Chỉ mục dùng nội bộ. Cần che thông tin nhạy cảm trong báo cáo gốc trước khi gửi ra ngoài.</p><input id="q" placeholder="Tìm QA-22, suite15, summary, manual…" aria-label="Tìm báo cáo"><p id="count"></p><table><thead><tr><th>Nhóm</th><th>Tệp báo cáo</th><th>Byte</th><th>Ghi chú</th></tr></thead><tbody>'''+''.join(rows)+'''</tbody></table><script>const q=document.querySelector('#q'),rows=[...document.querySelectorAll('tbody tr')];function filter(){let n=0;for(const r of rows){r.hidden=!r.textContent.toLocaleLowerCase('vi').includes(q.value.toLocaleLowerCase('vi'));if(!r.hidden)n++}document.querySelector('#count').textContent=n+' / '+rows.length+' tệp'}q.addEventListener('input',filter);filter();</script></html>'''
    if (OUT/'summaries/TSR_2026-11-17_R7.html').exists():
        page=page.replace('summaries/TSR_2026-11-17_DRAFT.md','summaries/TSR_2026-11-17_R7.html').replace('Test Summary Report dự thảo','Test Summary Report mới')
    if (REPO/'production_artifacts/test_reports/API_SUITE_HISTORY_2026-11-17/index.html').exists():
        page=page.replace('<nav>', '<nav><a href="../../production_artifacts/test_reports/API_SUITE_HISTORY_2026-11-17/index.html">Lịch sử API theo suite</a>')
    if (REPO/'production_artifacts/test_reports/TSR_API_2026-11-17/TSR_API.html').exists():
        page=page.replace('<nav>', '<nav><a href="../../production_artifacts/test_reports/TSR_API_2026-11-17/TSR_API.html">TSR API tổng hợp</a>')
    (OUT/'index.html').write_text(page,encoding='utf-8')
    print(json.dumps({'artifacts':len(records),'uniqueContents':len(groups),'counts':payload['counts']},ensure_ascii=False))

if __name__=='__main__': main()
