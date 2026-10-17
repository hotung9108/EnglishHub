"""Create and render a synthetic QA essay; no student or credential data."""
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / '.cache' / 'pdf-python'))
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT
import fitz

paragraphs = [
    'Learning English every day can improve communication, confidence and access to knowledge. Although occasional long lessons are useful, regular practice helps learners remember new vocabulary and use it in practical situations. In my view, a small daily routine is more sustainable than studying intensively only before an examination.',
    'First, daily practice gives learners repeated opportunities to meet familiar words in different contexts. A student may read a short news article in the morning, listen to a conversation during a journey and write a summary in the evening. These activities connect pronunciation, meaning and spelling. The learner gradually becomes able to recognise useful expressions without translating every sentence into another language.',
    'Second, a regular routine can reduce the fear of making mistakes. For example, students who record a short speech each day can compare their recordings and notice improvements in clarity. They can also identify recurring grammar errors and discuss them with a teacher. Constructive feedback turns mistakes into specific goals rather than reasons to stop practising. Progress becomes easier to understand when students review their earlier work.',
    'However, daily study should remain balanced. Repeating the same exercise without reflection may become boring and produce little improvement. Learners should combine reading, writing, listening and speaking, choose topics they enjoy and allow time for rest. Teachers can support this approach by assigning manageable tasks and giving feedback that students can apply in the next activity.',
    'In conclusion, learning English every day offers benefits when practice is purposeful and varied. A realistic schedule builds vocabulary, strengthens confidence and supports independent learning. The most effective routine includes achievable tasks, opportunities for communication and regular reflection on feedback. Consistency matters, but learners also need guidance and suitable resources to make their daily efforts worthwhile.',
]

output = root.parents[0] / 'output' / 'pdf' / 'qa29-writing-sample.pdf'
output.parent.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Essay', fontName='Helvetica', fontSize=11, leading=16, spaceAfter=12, alignment=TA_LEFT))
styles.add(ParagraphStyle(name='MetaQA', fontName='Helvetica', fontSize=9, leading=13, textColor=colors.HexColor('#526174'), spaceAfter=14))
story = [Paragraph('QA-29 | Writing sample', styles['Title']), Paragraph('Synthetic staging fixture - created for Selenium grading tests. No real student work.', styles['MetaQA']),
         Paragraph('The benefits of learning English every day', styles['Heading2']), Spacer(1, 8)]
story += [Paragraph(text, styles['Essay']) for text in paragraphs]
SimpleDocTemplate(str(output), pagesize=(595.28, 841.89), rightMargin=54, leftMargin=54, topMargin=46, bottomMargin=46).build(story)
document = fitz.open(output)
assert len(document) == 1
text = ''.join(page.get_text() for page in document)
assert all(paragraph.split()[-1] in text for paragraph in paragraphs)
assert len(' '.join(paragraphs).split()) >= 250
preview = root / '.cache' / 'qa29-writing-sample.png'
preview.parent.mkdir(parents=True, exist_ok=True)
document[0].get_pixmap(matrix=fitz.Matrix(1.5, 1.5)).save(preview)
(root / 'fixtures' / 'qa29-writing-sample.pdf').write_bytes(output.read_bytes())
print(f'PDF ready: {output}; essay words: {len(" ".join(paragraphs).split())}; pages: {len(document)}')
