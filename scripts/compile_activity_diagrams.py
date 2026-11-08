import os
import sys
from plantuml_client import render_plantuml

DIAGRAM_MAP = [
    (
        'docs/diagrams/activity/AD16_LamBaiTapViet.puml',
        'overleaf_reports/Project_1/final/images/Activity Diagram/AD16 - Làm bài tập viết.png'
    ),
    (
        'docs/diagrams/activity/AD17_LamBaiTapNoi.puml',
        'overleaf_reports/Project_1/final/images/Activity Diagram/AD17 - Làm bài tập nói.png'
    ),
    (
        'docs/diagrams/activity/AD25_HoTroChamChuaBaiBangAI_Chung.puml',
        'overleaf_reports/Project_1/final/images/Activity Diagram/AD25 - Hỗ trợ chấm chữa bài bằng AI (Chung).png'
    ),
    (
        'docs/diagrams/activity/AD27_HoTroChamChuaBaiNoiBangAI.puml',
        'overleaf_reports/Project_1/final/images/Activity Diagram/AD27 - Hỗ trợ chấm chữa bài nói bằng AI.png'
    ),
    (
        'docs/diagrams/activity/AD28_ChamBaiDoc.puml',
        'overleaf_reports/Project_1/final/images/Activity Diagram/AD28 - Chấm bài đọc.png'
    ),
    (
        'docs/diagrams/activity/AD36_XemBaoCaoVaThongKeHocTap.puml',
        'overleaf_reports/Project_1/final/images/Activity Diagram/AD36 - Xem báo cáo và thống kê học tập.png'
    ),
]

def main():
    print(f"Starting PlantUML MCP rendering for {len(DIAGRAM_MAP)} activity diagrams...")
    success_count = 0
    for puml_path, output_png in DIAGRAM_MAP:
        print(f"\n[Compiling] {puml_path} -> {output_png}")
        assert os.path.exists(puml_path), f"File not found: {puml_path}"
        os.makedirs(os.path.dirname(output_png), exist_ok=True)
        success, info = render_plantuml(puml_path, output_png, format='png')
        if success and os.path.exists(output_png):
            size_kb = os.path.getsize(output_png) / 1024
            print(f"  SUCCESS! Size: {size_kb:.1f} KB")
            success_count += 1
        else:
            print(f"  FAILED: {info}")
            sys.exit(1)

    print(f"\nAll {success_count}/{len(DIAGRAM_MAP)} PlantUML diagrams compiled successfully to PNG!")

if __name__ == '__main__':
    main()
