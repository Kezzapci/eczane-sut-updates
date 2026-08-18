from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from pathlib import Path

out = Path('docs/sample-report.pdf')
out.parent.mkdir(parents=True, exist_ok=True)
font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
pdfmetrics.registerFont(TTFont('DejaVu', font_path))
c = canvas.Canvas(str(out), pagesize=A4)
c.setFont('DejaVu', 12)
lines = [
    'ECZANE SUT RAPOR KONTROL TESTI',
    'Hasta Adı: Test Hasta',
    'Barkod: 8699525698636',
    'Rapor No: R-2026-0001',
    'Tanı: E11.9',
    'Rapor Tarihi: 18.08.2026',
    'Rapor Bitiş Tarihi: 18.08.2027',
    'Doz ve Kullanım: Günde 1 tablet',
    'Uzmanlık: İç Hastalıkları',
]
y = 790
for line in lines:
    c.drawString(60, y, line)
    y -= 28
c.save()
print(out)
