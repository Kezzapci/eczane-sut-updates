from pathlib import Path
from openpyxl import Workbook

out = Path(__file__).resolve().parents[1] / 'docs' / 'sample-report.xlsx'
wb = Workbook()
ws = wb.active
ws.title = 'Raporlar'
ws.append(['Hasta', 'Hasta No', 'İlaç Adı', 'Barkod', 'Rapor No', 'Rapor Tarihi', 'Rapor Bitiş Tarihi', 'Tanı', 'Doz ve Kullanım', 'Uzmanlık'])
ws.append(['Test Hasta', 'T-0001', '%0,9 IZOTONIK SODYUM KLORUR COZELTISI 100 ML BFS (SETSIZ)', '8699525698636', 'RPR-TEST-001', '18.08.2026', '18.08.2027', 'E86.0', 'Günde 1 ünite', 'İç Hastalıkları'])
wb.save(out)
print(out)
