# Eczane SUT Kontrol

**Eczane SUT Kontrol**, Windows 11 üzerinde eczane rapor dosyalarını yükleyip kontrol sonuçlarını göstermek, resmi SGK SUT verisini otomatik güncel tutmak ve yeni Windows sürümlerini GitHub Releases üzerinden yayınlamak için hazırlanan Electron tabanlı masaüstü uygulamasıdır.

> SUT ve geri ödeme kuralları yürürlük tarihi, tebliğ ve ek listelere göre değişebilir. Uygulama kontrol sonucunda kullandığı SUT veri sürümünü ve kontrol zamanını göstermelidir; sonuçlar yetkili eczane kullanıcısının nihai kontrolünün yerine geçmez.

## Tek depo mimarisi

Bu public depo aşağıdaki bileşenlerin tamamını birlikte içerir:

| Bileşen | Konum | Görev |
|---|---|---|
| Windows masaüstü uygulaması | `electron/`, `src/`, `index.html` | Rapor yükleme, kontrol ekranı ve güncelleme durumları. |
| SUT kaynak taraması | `scripts/fetch-sut.mjs`, `.github/workflows/sut-release.yml` | SGK duyurularını düzenli tarama ve yeni paket bulma. |
| Veri normalizasyonu | `scripts/normalize-sut.py` | SUT ZIP içindeki DOCX/XLS/XLSX eklerini aranabilir envantere dönüştürme. |
| SUT yayın manifesti | `sut/latest.json` | Masaüstü istemcisinin okuyacağı veri sürümü, URL, boyut ve SHA-256 bilgisi. |
| Windows Release | `.github/workflows/release.yml` | Etiket veya manuel çalıştırma ile Windows yükleyicisi üretme. |

Kaynak kod public olduğu için aynı depodaki yerleşik `GITHUB_TOKEN` ile Release asset’leri yayınlanabilir; cross-repository token veya kişisel anahtar uygulamaya gömülmez.

## Geliştirme

Node.js 22 veya daha yeni bir sürüm kurulu Windows 11 ortamında proje klasöründe şu komutlar çalıştırılır:

```bash
npm install
npm run dev
```

Web arayüzü için üretim derlemesi:

```bash
npm run build:web
```

Windows yükleyicisi için:

```bash
npm run dist:win
```

GitHub Actions üzerinde Windows Release üretmek için `main` dalına `v0.2.0` biçiminde bir etiket gönderilebilir veya **Actions → Windows sürümünü yayınla → Run workflow** kullanılabilir. `npm run release` komutu, Windows yükleyicisini oluşturur ve aynı public depoda Release asset’i olarak yayımlar.

## Otomatik SUT veri güncellemesi

`SGK SUT verisini yayımla` workflow’u günlük çalışır ve manuel olarak da tetiklenebilir. Süreç SGK Genel Sağlık Sigortası duyurularında işlenmiş güncel SUT paketini bulur, resmi ZIP dosyasını indirir, dosya boyutunu ve SHA-256 özetini doğrular, ardından `sut-data-YYYY.MM.DD-<hash8>` etiketiyle veri Release’i oluşturur. `sut/latest.json` dosyası bu Release asset’ini gösterir.

| Aşama | Uygulanan kontrol |
|---|---|
| Kaynak keşfi | SGK duyuru listesinde işlenmiş güncel SUT duyurusu aranır. |
| İndirme | ZIP dosyası HTTPS üzerinden alınır; başarısız indirme yayınlamayı durdurur. |
| Bütünlük | Boyut ve SHA-256 özeti karşılaştırılır. |
| İçerik | SUT ana metni ve aktif EK-4A ilaç listesi doğrulanır. |
| Yayın | Yeni veri etiketi ve Release asset’i oluşturulur. |
| İstemci | Masaüstü uygulaması açılışta ve altı saatte bir manifesti kontrol eder. |
| Kurulum | Paket geçici klasöre açılır; doğrulama geçmeden etkin veri klasörüne geçirilmez. |
| Geri alma | Hatalı pakette mevcut doğrulanmış veri korunur ve önceki klasör saklanır. |

İlk doğrulanmış paket 01/07/2026 tarihli işlenmiş SUT’tur. Paket 355 dosya içerir ve EK-1, EK-2, EK-3, EK-4 klasörlerini kapsar. Ayrıntılı envanter [`docs/sut-sources.md`](docs/sut-sources.md) dosyasındadır.

## Otomatik program güncellemesi

Paketli Windows uygulaması `electron-updater` ile bu deponun Releases bölümünü kontrol eder. Yeni program sürümü arka planda indirilir ve uygulama kapanırken kurulur. SUT veri sürümü program sürümünden bağımsızdır; yalnızca SUT değiştiğinde programı yeniden kurmak gerekmez.

Üretim güvenliği için Windows kod imzalama sertifikası ve sertifika parolası GitHub Actions secret’ları olarak eklenmelidir. Sertifika bilgileri kaynak koda, manifest dosyasına veya uygulamanın içine yazılmamalıdır.

## Rapor ve ilaç akışı

0.2.0 sürümünde USB barkod okuyucular klavye gibi kullanılabilir; barkod numarası veya ilaç adı arama alanına yazıldığında yerel resmi SGK EK-4A indeksi içinde aranır. Sonuç kartında ilaç adı, güncel barkod, kamu numarası, eşdeğer grup ve kaynak bilgisi gösterilir. İndeks 8.429 kayıtlıdır ve SUT veri paketi güncellendiğinde yeniden üretilir.

CSV ve XLSX raporları hasta, ürün/ilaç, barkod, rapor numarası, tarih, rapor bitiş tarihi, tanı/ICD-10, doz/kullanım ve uzmanlık alanı gibi başlıkları eşleştirerek eksik alanları kontrol listesinde gösterir. PDF seçim alanı arayüzde bulunur; PDF’nin serbest metnini güvenilir biçimde alanlara dönüştürme ve tüm SUT koşullarını madde düzeyinde uygulama sonraki doğrulanmış geliştirme katmanıdır. Uygulama hiçbir kaydı sahte uygun göstermemeli; kaynak bulunamadığında “inceleme gerekli” durumunu korumalıdır.

## Resmi kaynaklar

SUT otomasyonu şu resmi kaynakları temel alır:

1. [SGK Genel Sağlık Sigortası duyuruları](https://www.sgk.gov.tr/birimler/duyurular/GENEL-SAGLIK-SIGORTASI-GENEL-MUDURLUGU-2026-01-28-02-00-42)
2. [SGK 01/07/2026 işlenmiş güncel SUT duyurusu](https://www.sgk.gov.tr/duyuru/detay/01072026-SUT-Degisiklik-Tebligi-Islenmis-Guncel-2013-SUT-2026-07-01-02-55-17)
3. [Cumhurbaşkanlığı Mevzuat Bilgi Sistemi SUT kaydı](https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=17229&MevzuatTur=9&MevzuatTertip=5)

Ayrıntılı kaynak, dosya özeti ve test kayıtları `docs/` klasöründedir.
