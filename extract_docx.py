from docx import Document

doc = Document('N1核心词汇800词｜帝京日语 纯净_加水印.docx')

for para in doc.paragraphs:

    if para.text.strip():

        print(para.text)