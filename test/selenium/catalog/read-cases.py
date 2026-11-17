import json
import sys
import re

from openpyxl import load_workbook


with open(sys.argv[1], "rb") as source:
    workbook = load_workbook(source, read_only=True, data_only=True)
    try:
        rows = workbook["Test Cases"].iter_rows(min_row=2, values_only=True)
        cases = [
            dict(row=row, id=cells[0], group=cells[1], requirement=cells[2], technique=cells[3], title=cells[4],
                 precondition=cells[5], steps=cells[6], testData=cells[7], expected=cells[8], priority=cells[9])
            for row, cells in enumerate(rows, 2) if cells[0]
        ]
    finally:
        workbook.close()

if not cases or len({case["id"] for case in cases}) != len(cases):
    raise ValueError("Workbook must contain unique test case IDs")

# Keep workbook credentials and previous run results out of generated reports.
# Credentials in the reference workbook are examples, never a secret store.
def sanitize(value):
    if isinstance(value, str):
        return re.sub(r"\b(?:Password123!x?|Abc1234(?:5)?)", "[WORKBOOK_PASSWORD]", value)
    return value

print(json.dumps([{key: sanitize(value) for key, value in case.items()} for case in cases], ensure_ascii=True))
