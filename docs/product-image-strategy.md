# Ürün görseli stratejisi

## Veri kaynağı bulgusu

`data/medicine-index.json`, SGK EK-4/A Bedeli Ödenecek İlaçlar Listesi’nden üretiliyor. Kayıtlarda kamu numarası, barkod, eski barkodlar, ürün adı, eşdeğer grup ve indirim alanları bulunuyor; resmî SGK kaydında ambalaj fotoğrafı veya görsel URL’si bulunmuyor.

Bu nedenle ambalaj fotoğrafı kontrol kararının kanıtı olarak kullanılmayacak. Resmî indeks bilgisi ile görsel bilgi ayrı gösterilecek.

## Uygulanan davranış

İlaç kartı seçildiğinde ürün adı, barkod, kamu numarası ve eşdeğer grup bilgilerinin yanında barkoda özel bir görsel kimlik kartı gösteriliyor. İleride doğrulanmış bir `imageUrl` alanı eklenirse yalnızca HTTPS URL’leri yükleniyor; görsel yüklenemezse otomatik olarak aynı ürün adı ve barkodu taşıyan yer tutucuya dönülüyor.

Görselin bulunmadığı durumda kullanıcıya fotoğraf varmış gibi davranılmıyor. Kartta açıkça “Kimlik görseli · resmî SGK indeksinde ambalaj fotoğrafı yok” açıklaması kullanılıyor.

## Dış kaynak notu

Web aramasında üçüncü taraf ilaç veri hizmetlerinin kutu görselleri sunduğu görüldü; ancak bu kaynaklar SGK’nın resmî veri seti değil ve kullanım/lisans koşulları doğrulanmadan ürün görselleri ana veri paketine kopyalanmayacak. Bu sınır, yanlış marka veya yanlış ambalajın seçilen ilaç gibi gösterilmesini önlemek için korunuyor.

## Test ürünü

Gerçek SGK EK-4/A kaydı: `8699525698636` — `%0,9 IZOTONIK SODYUM KLORUR COZELTISI 100 ML BFS (SETSIZ)`, kamu no `A15367`. Bu üründe resmî indeks görseli olmadığı için uygulama ürün kimlik yer tutucusunu gösterecek.
