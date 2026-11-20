"""Read-only source extraction. Does not change the reference workbook or PDF."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import pymupdf

srs, workbook = map(Path, sys.argv[1:3])
root = Path(__file__).resolve().parent
cases = json.loads(subprocess.check_output([sys.executable, str(root / 'read-cases.py'), str(workbook)], text=True))
specs = {}
with pymupdf.open(srs) as document:
    for index, page in enumerate(document):
        text = page.get_text()
        match = re.search(r'Mã Use case\s+(UC\d{3})', text)
        if match:
            specs[match[1]] = {'pdfPage': index + 1, 'printedPage': index - 1, 'text': text.strip()}
    for code in range(1, 7):
        specs[f'USA0{code}'] = {'pdfPages': [114, 115], 'section': '4.1 Usability'}
pending = {
    'PROF_004': 'Name max 100 is an Excel assumption',
    'PROF_009': 'Minimum password length/strength assumption',
    'PROF_010': 'Minimum password length/strength assumption',
    'PROF_012': 'Password reuse convention unspecified',
    'MEM_004': 'Class capacity limit unspecified',
    'ASG_009': 'Assignment title max length unspecified',
    'ASG_014': 'Upper attempt limit unspecified',
    'ASG_015': 'Valid maximum-score range unspecified',
    'DO_004': 'Word-count min/max configuration not approved',
    'DO_012': 'Optional listening replay limit unspecified',
    'GRD_007': 'Empty feedback acceptance convention unspecified',
    'GRD_010': 'Reasonable AI response lacks an objective oracle',
    'GRD_014': 'Case/whitespace matching convention unspecified',
}
excluded = {
    'DO_017': 'Không có chức năng tự nộp khi hết giờ; loại khỏi phạm vi kiểm thử theo xác nhận của người dùng.',
    'GRD_012': 'Không có đặc tả xử lý audio nhiễu; loại khỏi phạm vi kiểm thử theo xác nhận của người dùng.',
}
for case in cases:
    if case['id'] in excluded:
        case['scopeExclusion'] = {'source': 'User confirmation in conversation', 'date': '2026-11-16', 'reason': excluded[case['id']]}
    if case['id'] == 'LOGIN_011':
        case['originalExpected'] = case['expected']
        case['expected'] = 'Email phân biệt hoa/thường: email đổi hoa/thường với mật khẩu đúng bị từ chối, thông báo tài khoản hoặc mật khẩu không chính xác; ở lại /login và không cấp phiên đăng nhập.'
        case['requirementClarification'] = {'source': 'User confirmation in conversation', 'date': '2026-11-16', 'rule': 'Email is case-sensitive'}
    references = re.findall(r'UC\d{3}|USA\d{2}', case['requirement'])
    # Excel abbreviates the second half in UC013/14 and UC027/28.
    for suffix in re.findall(r'/([0-9]{2})(?![0-9])', case['requirement']):
        references.append('UC0' + suffix)
    case['sourceReferences'] = {code: {k: v for k, v in specs.get(code, {}).items() if k != 'text'} for code in references}
    if case['id'] in pending:
        case['pendingOracleOrFixture'] = pending[case['id']]
catalog = {
    'sources': {kind: {'name': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for kind, path in [('srs', srs), ('workbook', workbook)]},
    'total': len(cases), 'specs': specs, 'cases': cases,
    'scopeNote': 'USA01-06 covered by UI cases. MAI01-06 require source/CI/coverage evidence and cannot be inferred from Selenium pass rate.'
}
(root / 'cases.imported.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'cases': len(cases), 'useCases': len([k for k in specs if k.startswith('UC')]), 'pendingOracleOrFixture': len(pending)}))
