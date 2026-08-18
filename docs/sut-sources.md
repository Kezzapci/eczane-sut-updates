# Resmi SUT Kaynakları

Araştırma tarihi: 18 Ağustos 2026

## 1. SGK duyuru sayfası

- URL: https://www.sgk.gov.tr/duyuru/detay/10122025-SUT-Degisiklik-Tebligi-Islenmis-Guncel-2013-SUT-2025-12-10-03-35-49
- Sayfa başlığı: 10/12/2025 SUT Değişiklik Tebliği İşlenmiş Güncel 2013 SUT
- SGK sayfasında yayımlanan içerik bir ZIP dosyasıdır: `2025.12.10-Değişiklik Tebliği İşlenmiş Güncel 2013 SUT.zip`.
- Sayfa, duyuruyu Genel Sağlık Sigortası Genel Müdürlüğü altında ve 10 Aralık 2025 tarihiyle sunmaktadır.
- Bu kaynak, otomatik tarayıcı için öncelikli SGK kaynağı olarak değerlendirilecektir; indirilen dosyanın hash'i ve kaynak URL'si saklanmalıdır.

## 2. Cumhurbaşkanlığı Mevzuat Bilgi Sistemi

- URL: https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=17229&MevzuatTur=9&MevzuatTertip=5
- Resmî Gazete tarihi: 24.03.2013; sayı: 28597.
- Sayfada Word ve PDF dışa aktarma bağlantıları bulunur:
  - https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/9.5.17229.doc
  - https://www.mevzuat.gov.tr/MevzuatMetin/yonetmelik/9.5.17229.pdf
- Bu kayıt, SGK yayımlarının yanında çapraz doğrulama ve temel mevzuat kimliği için tutulacaktır.

## Uygulama kararı

SUT güncelleme servisi resmi SGK duyurularını düzenli olarak tarayacak, yeni dosya veya yeni duyuru tespit ettiğinde kaynak URL'sini, yayın tarihini, indirme tarihini, SHA-256 hash'ini ve işlenmiş kural sürümünü kaydedecektir. Mevzuat Bilgi Sistemi, metin karşılaştırması için ikinci resmi doğrulama kaynağı olacaktır. Tam otomatik yayın akışında başarısız ayrıştırma veya beklenmeyen içerik farkı varsa sürüm üretimi durdurulmalı ve mevcut sürüm korunmalıdır.

## 3. En güncel resmi SGK duyurusu

Araştırma sırasında SGK arama sonuçlarında 18 Ağustos 2026 itibarıyla en yeni işlenmiş SUT duyurusu 1 Temmuz 2026 tarihli olarak doğrulandı.

- URL: https://www.sgk.gov.tr/duyuru/detay/01072026-SUT-Degisiklik-Tebligi-Islenmis-Guncel-2013-SUT-2026-07-01-02-55-17
- Sayfa başlığı: 01/07/2026 SUT Değişiklik Tebliği İşlenmiş Güncel 2013 SUT
- SGK sayfasındaki dosya adı: `2026.07.01-Değişiklik Tebliği İşlenmiş Güncel 2013 SUT.zip`
- Sayfadaki yayın tarihi: 1 Temmuz 2026 Çarşamba.

Otomatik tarama için SGK'nın Genel Sağlık Sigortası duyuru arama/listesi de izlenecek; doğrudan tek bir sabit dosya URL'sine bağımlı kalınmayacaktır. 404 veren eski liste URL'si yerine SGK arama sonuçları ve `birimler/duyurular/GENEL-SAGLIK-SIGORTASI-GENEL-MUDURLUGU-2026-01-28-02-00-42` biçimindeki güncel duyuru listesi keşif kaynağı olarak kullanılmalıdır.

## 4. SGK ek dosya envanteri

17 Ocak 2026 tarihli SGK duyurusunda ek dosyalar ayrı indirme bağlantılarıyla yayımlanmıştır. Sayfanın resmi adresi: https://www.sgk.gov.tr/duyuru/detay/17012026-Tarihli-ve-33140-Sayili-Resm-Gazetede-Yayimlanan-Sosyal-Guvenlik-Kurumu-Saglik-Uygulama-Tebliginde-Degisiklik-Yapilmasina-Dair-Teblig-2026-01-20-08-51-32

| Ek | Resmi dosya adı | Eczane kontrolündeki rol |
|---|---|---|
| Ek-7 | EK-4A BEDELİ ÖDENECEK İLAÇLAR LİSTESİ.xlsx | İlaç geri ödeme ve aktif/pasif ürün eşleştirmesi için temel liste |
| Ek-8 | EK-4C YURT DIŞI İLAÇ FİYAT LİSTESİ.xlsx | Yurt dışı ilaç ve fiyat kontrolleri için yardımcı liste |
| Ek-6 | EK-3C-5 ÖZEL HALLERDE KARŞILANAN TIBBİ MALZEMELER LİSTESİ.xls | Özel tıbbi malzeme koşulları |
| Ek-1 | EK-2B HİZMET BAŞI İŞLEM PUAN LİSTESİ.xlsx | Hizmet/işlem kodu eşleştirmesi |
| Ek-2 | EK-2C TANIYA DAYALI İŞLEM PUAN LİSTESİ.xlsx | Tanıya dayalı işlem kontrolleri |
| Ek-3 | EK-3C-2 EKSTERNAL ALT VE ÜST EKSTREMİTE GÖVDE PROTEZ ORTEZLER LİSTESİ.xls | Protez/ortez kontrolleri |
| Ek-4 | EK-3C-3 DİĞER PROTEZ ORTEZLER LİSTESİ.xls | Protez/ortez kontrolleri |
| Ek-5 | EK-3C-4 TIBBİ SARF MALZEMELER LİSTESİ.xls | Tıbbi sarf malzemesi kontrolleri |
| Tebliğ | 17.01.2026 SUT DEĞİŞİKLİK TEBLİĞİ.docx | Değişikliklerin yürürlük ve hüküm metni |

Uygulama, bu tip duyuru sayfalarını tek tek sabit URL olarak kopyalamak yerine SGK HTML içindeki dosya adı ve `Download/DownloadFile` bağlantılarını keşfederek güncel dosya envanteri çıkaracaktır. Eczane MVP'sinde EK-4A, SUT metni ve değişiklik tebliği zorunlu veri grubudur; diğer ekler kaynak arşivinde korunacak ve kontrol kapsamına göre etkinleştirilecektir.

## 5. 01/07/2026 işlenmiş SUT ZIP içeriği

Resmi SGK ZIP dosyası 30.632.706 byte boyutunda ve SHA-256 özeti `46a95d66e074baa7d8f39419b639d19a204077ddbf38f8dabaab4ad06c015f63` olarak doğrulanmıştır. ZIP içinde **355 dosya** bulunmaktadır. Ana dağılım şöyledir:

| Grup | Dosya sayısı |
|---|---:|
| EK-1 listeleri | 8 |
| EK-2 listeleri | 81 |
| EK-3 listeleri | 237 |
| EK-4 listeleri | 27 |
| Ana işlenmiş SUT DOCX | 1 |
| Diğer klasör girdileri | 1 |

Paket yalnızca yeni değişiklik metnini değil, güncel ve mülga ek listeleri de taşıdığı için veri güncelleme servisi ZIP’in tamamını arşivleyecek; rapor kontrol motoru ise yürürlükteki listeleri manifestteki tarih ve dosya adına göre seçecektir. Mülga listeler kontrol kararında kullanılmayacak, ancak denetlenebilirlik için paketin ham arşivinde tutulacaktır.
