# Ekran kaydı analizi: TEBRP benzeri SUT kontrol akışı

## Kaynak

Kullanıcının gönderdiği ekran kaydı `Ekrankaydı1(online-video-cutter.com).mp4` analiz edilmiştir. Görüntüdeki uygulama `tebrp - Türk Eczacıları Birliği` başlığıyla görünen web tabanlı bir ilaç/SUT kontrol ekranıdır. Aşağıdaki maddeler yalnızca videoda gözlemlenen akışı ve güvenli ürün gereksinimlerini özetler.

## Gözlemlenen akış

| Zaman | Ekran ve işlem | Ürüne aktarılacak gereksinim |
|---|---|---|
| 00:00–00:02 | Sol ilaç listesi, orta SUT Kontrol paneli, sağ SUT Özet ve Reçete İlaç Listesi panelleri görünür. XARELTO 10 mg seçilidir. | Üç panelli çalışma alanı: ilaç/arama, etkileşimli SUT kuralı, özet ve reçete bağlamı. |
| 00:03–00:07 | Kullanıcı Raporlu ve ardından Ayaktan seçeneklerini seçer. Sağ özet paneli duruma göre renklenir. | Tedavi türü, rapor durumu ve ayaktan/yatan seçimi sonuca etki eden ilk adımlar olmalıdır. |
| 00:08–00:13 | Kullanıcı rapor kodu/endikasyon seçer: 20.00 ve reçete uyarı kodu 258 – elektif kalça replasmanı. Ardından derin ven trombozu profilaksisi endikasyonunun mevcut olduğunu belirtir. | Kural akışı seçilen ürün, rapor kodu ve endikasyona göre dinamik sorular üretmelidir. |
| 00:14–00:17 | Dört uygunluk kutusu işaretlenir: uzman hekim raporu, rapor hekimi branşı, reçete hekimi branşı ve diz/kalça kutu sınırı. | AI kutuları körlemesine işaretlememeli; belgeden kanıt bulup her kural için kanıt ve güven düzeyi göstermelidir. |
| 00:17–00:20 | Tüm seçimlerden sonra “Rapor Uygun!” sonucu ve antikoagülanların birlikte kullanımına dair sarı uyarı görünür. | Sonuç özeti, kritik uyarılar ve ilgili SUT kaynakları birlikte görünmelidir. |

## Belirlenen hata riski ve eksikler

Videoda kutuların manuel işaretlenmesi, yanlış branş veya miktar seçiminin fark edilmeden onaylanabilmesi açısından temel risktir. Ayrıca ilaç/kutu miktarı sayısal olarak girilmiyor; yalnızca kural onayı veriliyor. Yeni uygulamada kutu sayısı, doz, süre, uzmanlık ve tanı alanları belge üzerinden çıkarılmalı ve kullanıcıya doğrulatılmalıdır.

## Uygulanacak AI davranışı

1. Kullanıcı rapor veya reçete PDF/görseli yüklediğinde sistem metin katmanını okumalı; taranmış belgelerde OCR gerektiğini belirtmelidir. Hekim branşı, tanı/ICD-10, rapor kodu, endikasyon, ilaç, barkod, kutu miktarı ve süre alanları çıkarılmalıdır.
2. Seçilen ürün ile rapordaki barkod/ilaç adı çapraz kontrol edilmelidir. Uyuşmazlık otomatik hata, eksik veya belirsiz alanlar manuel inceleme olarak gösterilmelidir.
3. Seçilen rapor kodu ve endikasyona göre dinamik soru/kanıt listesi oluşturulmalıdır. Örneğin branş ve kutu sınırı soruları, belgeden alınan kanıtla birlikte gösterilmelidir.
4. Her sonuç için `uygun`, `uygunsuz`, `eksik kanıt` veya `manuel inceleme` durumlarından biri kullanılmalıdır. AI kesin ödeme kararı vermemeli ve kutuları kanıtsız otomatik onaylamamalıdır.
5. Etkileşim uyarıları yalnızca rapor/reçete içinde desteklenen ilaçlar veya kullanıcı tarafından sağlanan geçmiş ilaç listesi varsa güçlendirilmelidir. Varsayım yapılmamalıdır.
6. İlaç araması typo toleranslı ve eksik adla çalışmalıdır; ancak sonuç resmi EK-4A kaydıyla eşleşmeden kesin ilaç seçimi yapılmamalıdır.

## İlk uygulama kapsamı

İlk AI sürümünde güvenli ve doğrulanabilir kapsam; mevcut PDF metin ayrıştırmasını genişletmek, OCR gerektiren belgeleri ayırmak, çıkarılan alanları kanıt satırlarıyla göstermek, SUT kural sorularını yapılandırılmış JSON olarak üretmek ve kaynaklı ön değerlendirme yazmaktır. SUT metninde açıkça bulunmayan bir koşul AI tarafından icat edilmemelidir.
