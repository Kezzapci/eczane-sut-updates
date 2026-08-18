
# İlk UI Test Notları

18 Ağustos 2026 tarihinde Vite önizlemesi tarayıcıda açıldı. Rapor kontrol paneli, sol menü, istatistik kartları, CSV/PDF/XLSX yükleme alanı, SUT sürüm kartı ve son aktiviteler bölümü görsel olarak düzgün yüklendi. Türkçe metinler ve tablo düzeni okunabilir durumda.

Dosya input'u uygulama arayüzünde bilinçli olarak gizli (`display:none`) tutulduğu için tarayıcı tabanlı test yükleyicisi input'u bulamadı. Gerçek Electron uygulamasında “Dosya seç” ve “Yeni rapor yükle” düğmeleri bu gizli input'u programatik olarak açtığından kullanıcı akışı çalışacak şekilde tasarlanmıştır. CSV ayrıştırma mantığı ayrıca `npm run build:web` ve yerel kod testiyle doğrulanacaktır.

## 2026-08-18 güncelleme ve dağıtım testleri

- Public `Kezzapci/eczane-sut-updates` deposunun `SGK SUT verisini yayımla` workflow’u manuel çalıştırıldı ve GitHub Actions üzerinde başarılı tamamlandı.
- Public manifestten indirilen SUT paketi **30.632.706 byte**, SHA-256 `46a95d66e074baa7d8f39419b639d19a204077ddbf38f8dabaab4ad06c015f63`, toplam ZIP girdisi `355`, ana SUT DOCX ve aktif EK-4A XLSX mevcut olarak doğrulandı.
- `normalize-sut.py` gerçek arşiv üzerinde `346` dosya, `315` spreadsheet, `17` DOCX ve `0` ayrıştırma hatası üretti; `hasEk4a=true` doğrulandı.
- Electron renderer üretim derlemesi `npm run build:web` başarılıdır.
- Electron ana süreç, preload ve SUT scriptleri `node --check` ile doğrulandı.
- Linux sandbox’ında Windows NSIS üretimi Wine eksikliği nedeniyle son imzalama adımında durdu; Windows yükleyici için GitHub Actions `windows-latest` workflow’u kullanılmalıdır.
- Public tek depo mimarisinde program Release’i ve SUT veri Release’i aynı repository içinde yerleşik `GITHUB_TOKEN` ile yayınlanır; kişisel token uygulama içine gömülmemiştir.
