# Eczane SUT Kontrol — Görsel yeniden tasarım sözleşmesi

## Hedef

Arayüz, klasik dashboard yerine eczacının tek oturumda ilaç seçtiği, raporu yüklediği, SUT sorularını yanıtladığı ve kaynaklı ön kontrol sonucunu aldığı üç panelli bir çalışma masası olarak tasarlanacaktır.

## Ekran mimarisi

| Bölge | Sorumluluk | Görsel davranış |
|---|---|---|
| Sol sabit ray | Logo, çalışma alanları, bağlantı ve sürüm durumu | Koyu lacivert yüzey, seçili modül için turkuaz ışık çizgisi |
| Üst komut çubuğu | Sayfa adı, SUT veri sürümü, program güncellemesi ve kullanıcı çalışma alanı | Cam etkili, sabit başlık, durum rozetleri |
| Orta çalışma alanı | Barkod/ilaç arama, ilaç kartı, rapor yükleme ve sonuç tablosu | Büyük odak kartı, yükleme animasyonu, veri geldiğinde kademeli görünüm |
| Sağ karar paneli | SUT soru akışı, AI kanıt listesi, sonuç özeti ve kritik uyarılar | Renkli durum sinyalleri; kanıt yoksa otomatik onay yok |

## Görsel dil

Koyu petrol lacivert temel zemin üzerinde kırık beyaz yüzeyler, SGK/SUT doğrulaması için turkuaz, uygunluk için yeşil, inceleme için amber ve uyuşmazlık için kırmızı kullanılacaktır. Kart köşeleri orta yuvarlaklıkta olacak; gölgeler düşük yoğunluklu, çizgiler ince ve veri yoğunluğu yüksek fakat nefes alan bir ritimde tutulacaktır.

## Animasyon ilkeleri

Animasyonlar sonucu gizlemeyecek veya bekleme hissini yapay biçimde uzatmayacaktır. Sayfa ve kartlar kısa fade/slide ile açılacak, veri taraması sırasında skeleton satırları ve dönen durum göstergesi kullanılacak, AI analizinde yalnızca analiz düğmesi ve karar satırı hareket edecektir. `prefers-reduced-motion` desteği zorunludur.

## İşlevsel görünürlük

Barkod sonucu resmi EK-4A kaydıyla eşleşmeden “kaynaklı” kabul edilmeyecektir. PDF/XLSX/CSV yükleme durumu, rapor alanlarının bulunma durumu ve SUT paketi sürümü aynı ekran üzerinde görünür olacaktır. “Uygun” sonucu yalnızca kanıtlar bulunduğunda gösterilecek; kesin ödeme kararı gibi sunulmayacaktır.

## Kapsam dışı

RK/TEBRP ekranları kopyalanmayacak; yalnızca kullanıcı akışı kategorileri ve güvenli ürün ilkeleri referans alınacaktır. Görsel olarak gerçekçi görünüm sağlanırken SGK verisi olmayan klinik koşullar uydurulmayacaktır.
