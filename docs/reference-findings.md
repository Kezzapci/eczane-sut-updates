# Referans inceleme notları

## RaporKontrol.com

18 Ağustos 2026 tarihinde incelendi. Site, RK Rapor Kontrol Programı’nın Windows işletim sistemlerinde çalıştığını, kurulumun sıkıştırılmış bir setup dosyasından yapıldığını ve serbest eczaneler için terminal lisansı/IP kontrollü kullanım sunduğunu belirtiyor. Sayfa, programın ilaç kullanım raporlarıyla ilgili SGK’ya fatura edilen/edilecek reçetelerin geri ödemesine ilişkin nihai garanti vermediğini de açıkça belirtiyor. Ana sayfada ayrıntılı uygulama ekranı değil, lisans ve kurulum bilgileri var; bu nedenle barkod/rapor kontrol ekranı doğrudan gözlemlenemedi.

Kaynak: https://www.raporkontrol.com/

## TEBRP

18 Ağustos 2026 tarihinde incelendi. `https://www.tebrp.com/` adresi `tebrp_plus/login/login.jsp` giriş ekranına yönlendiriyor ve uygulama içeriği kimlik doğrulama olmadan görünmüyor. Sayfada KVKK/GDPR çerez bildirimi bulunuyor. Bu nedenle TEBRP’nin giriş sonrası işlevleri kullanıcı hesabı olmadan doğrulanamadı; kaynak siteden içerik veya uygulama kodu kopyalanmayacak.

Kaynak: https://www.tebrp.com/

## Uygulama sonucu

Kendi uygulamamızda referans olarak yalnızca genel kullanıcı akışları ve işlev kategorileri kullanılacak: Windows masaüstü kurulumu, barkod/ilaç girişi, rapor gereksinimlerinin listelenmesi, SUT verisinin sürümlü güncellenmesi ve her kontrol sonucunun gerekçesiyle gösterilmesi. RK/TEBRP’nin nihai geri ödeme garantisi vermediğine ilişkin yaklaşım benimsenecek; program sonucu yetkili eczacı kontrolünün yerine geçirilmeyecek.

Son güncelleme: 2026-08-18

---

## Kaynak bağlantıları

- https://www.raporkontrol.com/
- https://www.tebrp.com/

## TEBRP özellikleri — resmi ve oda duyuruları

Türk Eczacıları Birliği’nin 15 Kasım 2017 tarihli duyurusuna göre TEBRP; temel müstahzar bilgileri, fiyat/iskonto hareketleri, hasta maliyeti hesaplama, etkin madde ve firma bilgileri, SUT ilişkili açıklamalar ve özetleri, reçete/rapor SUT kontrolü, MEDULA bilgileri, eşdeğer ürünler, KÜB/KT, tıbbi malzeme ve monograf bilgileri, ICD-10/ATC/NFC/USP indeksleri, sanal reçete ve raporlama, ilaç-ilaç/ilaç-besin etkileşimi, müstahzar karşılaştırma, uluslararası marka arama, ileri tarihli fiyat değişimi ve benzeri modülleri listeliyor.

Bursa Eczacı Odası’nın 29 Ocak 2020 tarihli duyurusunda arama modülünün güncellendiği, kategorik filtreleme eklendiği, SUT özet ve SUT kontrol modüllerinin ana menüye alındığı, fiyat geçmişinin ayrıntılandırıldığı, veritabanı/performance iyileştirmeleri yapıldığı ve mobilde kamera, etkileşim, SUT ve EK-4D modüllerinin düzenlendiği belirtiliyor.

Bu özellikler uygulamamız için şu modül gruplarına dönüştürüldü: (1) hızlı barkod/müstahzar arama, (2) ürün ve etkin madde kartı, (3) SUT koşul ve rapor kontrolü, (4) reçete/rapor çalışma alanı, (5) eşdeğer/fiyat geçmişi, (6) etkileşim ve uyarılar, (7) kaynak maddesi gösteren AI açıklama asistanı, (8) veri sürümü ve güncelleme merkezi.

Kaynaklar:
- https://www.teb.org.tr/news/96cebd28-be82-4b93-813b-3a8604a1dd4f/tebrp-web-uygulamasi-hakkinda
- https://www.beo.org.tr/duyuru/tebrp-uygulamasi-hakkinda-63595

## SGK EK-4A barkod veri yapısı

18 Ağustos 2026 tarihinde SGK’nın resmi DownloadFile bağlantısından alınan EK-4A Excel dosyası görsel olarak incelendi. Dosya `EK-4A` adlı tek çalışma sayfasında 8.432 satır ve 16 sütun içeriyor. Arama/barkod modülü için bu resmi listenin güncel barkodu, eski barkodları, ilaç adı ve kamu/ödeme bilgilerini içeren alanları temel kaynak olarak kullanılacak. Barkod eşleştirmesinde yalnızca güncel barkod değil, listede bulunan eski barkodlar da indekslenecek; aynı barkoda sahip birden fazla kayıt veya pasif/aktif durumlar belirsizse sonuç otomatik uygun sayılmayıp inceleme uyarısı verilecek.

Kaynak dosya: https://www.sgk.gov.tr/Download/DownloadFile?f=0ec1109c-a3fb-4723-867e-20567d7a67f5.xlsx&d=fa049c02-7d15-412e-8fb8-430c4f4f8694

Not: SGK EK-4A, geri ödeme/barkod eşleştirmesi için resmi ve güçlü bir kaynak olmakla birlikte, ürünün tüm klinik/rapor koşullarını tek başına içermez. Rapor koşulları SUT metni, ilgili ekler ve yürürlük tarihleriyle birlikte değerlendirilmelidir.
