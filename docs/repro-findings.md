# Çalışmıyor bildirimi sonrası yeniden üretim bulguları

Tarih: 18.08.2026

## Sonuç

`npm run dev` ile uygulama ve Vite renderer açıldı. Yerel önizlemede boş ekran yok. Gerçek doğrulanmış barkod `8699525698636` girildiğinde SGK EK-4A kaydı başarıyla bulundu ve seçimden sonra ilaç kartı oluştu.

## Görülen sorunlar

| Bulgu | Etki | Öncelik |
|---|---|---|
| Renderer başlangıç durumunda `appVersion` değeri `0.2.0` görünüyor | Kaynak/package sürümü 0.3.0 olsa da arayüz yanlış sürüm gösteriyor; kullanıcı yeni paketin yüklendiğine güvenemiyor | Yüksek |
| Arama sonucu var ancak rapor yüklemeden SUT kontrolü çalıştırıldığında anlamlı akış başlamıyor | Video akışındaki raporlu/ayaktan, rapor kodu, endikasyon ve uzmanlık soruları yok | Yüksek |
| Barkod arama ve ilaç kartı çalışıyor | Temel ilaç seçimi sağlam | Doğrulandı |
| Asistan yalnızca sabit paragraf üretiyor | Rapor kanıtı, kutu miktarı, dinamik SUT soruları ve kaynak maddesi analizi yok | Yüksek |
| SUT bilgisi geliştirme önizlemesinde `Veri aranıyor` kalabiliyor | Paketli Electron’da IPC ile ayrıca test edilmeli | Orta |

## Teknik not

Tarayıcı konsolunda uygulama renderer hatası görülmedi. Electron geliştirme sürecinde GPU başlatma uyarısı ve DevTools Autofill protokol uyarıları görüldü; bunlar arayüzün açılmasını engellemedi. Paketli Windows kurulumunun ayrıca kullanıcı makinesinde test edilmesi gerekir.

## Düzeltme sonrası doğrulama

`npm run build:web` başarılı. Önizlemede sürüm artık package.json’dan gelen `0.3.0` olarak görünüyor. Akıllı asistan kartı; barkod karşılaştırması, rapor/tanı, tarih/doz, uzmanlık, kutu miktarı kanıtlarını ve videodaki tedavi türü, uygulama yeri, rapor/reçete kodu, endikasyon ve hekim/kutu teyidi soru akışını gösteriyor. Gerçek barkod girildiğinde canlı arama sonucu oluşuyor.

Not: Bu turdaki “AI” çalışma zamanı dış API anahtarı gerektirmeyen, yerel ve kaynaklı kanıt/uyarı motorudur; kesin ödeme kararı vermez. Generatif bulut AI ayrıca yapılandırılmadı.

## Akıllı analiz testi

Gerçek barkod seçildikten sonra `Akıllı analiz` düğmesi çalıştı. İlaç kaydı SGK EK-4/A kanıtı olarak gösterildi; rapor barkodu, rapor/tanı, tarih/doz, uzmanlık ve kutu miktarı eksikleri ayrı kanıt satırlarına ayrıldı. SUT soru akışı tedavi türü, uygulama yeri, rapor/reçete kodu, endikasyon ve hekim/kutu teyidi alanlarını açtı. Analiz sonucu uygunluk garantisi vermeden manuel inceleme uyarısı üretti.

## 2026-08-18 — Ürün görsel kartı doğrulaması

Gerçek SGK barkodu `8699525698636` girildi ve `%0,9 IZOTONIK SODYUM KLORUR COZELTISI 100 ML BFS (SETSIZ)` kaydı seçildi. Yeni ilaç kartı, SGK / EK-4A kimlik görselini; ürün adı, barkod, kamu numarası `A15367`, eşdeğer grubu `E219C` ve “resmî SGK indeksinde ambalaj fotoğrafı yok” açıklamasını gösterdi. Seçim sonrasında rapor gereksinimleri, kaynaklı AI ön değerlendirmesi ve SUT soru akışı aynı ekranda yenilendi.

Resmî indeksinde ürün fotoğrafı bulunmadığı için yanlış marka/ambalaj göstermemek üzere fotoğraf yerine ürün adı ve barkod taşıyan görsel kimlik yer tutucusu kullanıldı. Gelecekte doğrulanmış HTTPS `imageUrl` alanı eklenirse gerçek görsel, yüklenemezse otomatik yer tutucu gösterilecek.
