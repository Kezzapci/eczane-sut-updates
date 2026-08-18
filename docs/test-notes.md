
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

## 18.08.2026 — Barkod ve aktif kontrol arayüzü doğrulaması

Yeni 0.2.0 arayüzü Vite önizlemesinde doğrulandı. Ekranda barkod veya ilaç adı girişi, USB barkod okuyucunun klavye gibi çalışacağı açıklaması, canlı arama düğmesi, ilaç seçim kartı, rapor yükleme alanı, sonuç tablosu, altı maddelik rapor gereksinim listesi, SUT veri merkezi ve kaynaklı AI asistanı bölümleri görünür. Başlangıçta ilaç ve rapor seçilmediği için gereksinimler eksik durumunda gösteriliyor; sahte örnek kayıtlar gösterilmiyor. Vite üretim derlemesi ve Electron ana süreç sözdizimi başarılıdır.

Not: PDF dosyasının tam alan ayrıştırması ve SUT koşullarının tüm madde düzeyindeki uygulaması üretim yayını öncesi ayrıca doğrulanmalıdır; arayüz bu durumu kesin uygunluk gibi göstermemektedir.

### Barkod arama testi

Gerçek EK-4A barkodu `8699525698636` girildiğinde `%0,9 IZOTONIK SODYUM KLORUR COZELTISI 100 ML BFS (SETSIZ)` sonucu, barkod ve Kamu No `A15367` ile seçilebilir sonuç olarak görüntülendi. Arama, 8.429 kayıtlı yerel SGK indeksinden çalıştı.

### İlaç seçimi ve asistan testi

Arama sonucuna tıklanınca ilaç kartı aktifleşti; güncel barkod, eşdeğer grup, kamu numarası ve resmi EK-4/A kaynağı gösterildi. Akıllı asistan, kaynağıyla birlikte tanı, tarih, doz ve yetkili uzmanlık alanlarının ayrıca doğrulanması gerektiğini belirtti. Gereksinim paneli 0/6 eksik alanı doğru biçimde gösterdi. DOM doğrulamasında rapor input’u `#file-input`, kabul edilen uzantılar `.pdf,.xlsx,.xls,.csv,.txt` olarak bulundu.

### XLSX yükleme denemesi

Dosya seç düğmesi arayüzde doğru çalışıyor. Test tarayıcısında gizli file input’a doğrudan otomasyon yüklemesi Node hedef sınırlaması nedeniyle başarısız oldu; bu, Electron/Windows kullanıcı akışının değil sandbox tarayıcı testinin kısıtıdır. XLSX ayrıştırma bağımlılığı ve alan eşleştirme kodu derleme aşamasında doğrulanmıştır.

### Sandbox test hazırlığı

`#file-input` elementi bulundu ve kabul ettiği formatlar `.pdf,.xlsx,.xls,.csv,.txt` olarak doğrulandı. Sandbox tarayıcısında görünürleştirilerek dosya yükleme otomasyonuna hazırlanmıştır.

### Başarılı XLSX uçtan uca testi

`sample-report.xlsx` görünür file input üzerinden yüklendi. Uygulama 1 kayıt buldu; hasta, barkod, rapor numarası, tanı, tarih, doz/kullanım ve uzmanlık alanlarını eşleştirdi. Gereksinim paneli 6/6, sonuç özeti 1 uygun kayıt, %100 olarak görüntülendi. Bu sonuç yalnızca test dosyasının alan bütünlüğünü gösterir; SUT kapsamındaki nihai ödeme uygunluğu anlamına gelmez.
