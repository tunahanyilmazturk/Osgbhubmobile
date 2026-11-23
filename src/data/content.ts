/**
 * Online eğitim içerikleri (demo). Yönetici panelindeki içerik editöründen
 * değiştirilebilir; bu dosya yalnızca başlangıç verisidir.
 */
import type { Lesson, Question, TrainingContent } from './types';

/** Örnek video — içerik editöründen kendi eğitim videonuzla değiştirin */
export const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

let n = 0;
const sid = () => `s${++n}`;

const slides = (id: string, title: string, minutes: number, items: [string, string][]): Lesson => ({
  id,
  title,
  type: 'slides',
  minutes,
  slides: items.map(([t, body]) => ({ id: sid(), title: t, body })),
});

const video = (id: string, title: string, minutes: number, description: string): Lesson => ({
  id,
  title,
  type: 'video',
  minutes,
  videoUrl: SAMPLE_VIDEO,
  description: `${description}\n\n(Örnek video — içerik editöründen kendi eğitim videonuzla değiştirin.)`,
});

const q = (id: string, text: string, options: string[], answer: number): Question => ({ id, text, options, answer });

function content(lessons: Lesson[], bank: Question[], preCount: number, timeLimit: number): TrainingContent {
  return {
    lessons,
    preTest: { questions: bank.slice(0, preCount).map((x) => ({ ...x, id: `${x.id}p` })), timeLimit: 0 },
    finalExam: { questions: bank, timeLimit },
    passScore: 70,
    maxAttempts: 3,
  };
}

export const CONTENT: Record<string, TrainingContent> = {
  /* ---------------- Temel İSG ---------------- */
  tr1: content(
    [
      slides('tr1-l1', 'İSG mevzuatı ve temel kavramlar', 15, [
        ['6331 sayılı İş Sağlığı ve Güvenliği Kanunu', '2012 yılında yürürlüğe girdi\nKamu ve özel sektördeki tüm işlerde, tüm çalışanlara uygulanır\nİşverenin ve çalışanın yükümlülüklerini belirler'],
        ['Temel kavramlar', 'Tehlike: zarar verme potansiyeli\nRisk: tehlikeden kaynaklanacak kayıp veya yaralanma ihtimali\nRisk değerlendirmesi: tehlikeleri belirleyip önlemleri planlama çalışması'],
        ['İşverenin yükümlülükleri', 'Riskleri değerlendirmek ve önlem almak\nÇalışanlara İSG eğitimi vermek\nİSG uzmanı ve işyeri hekimi görevlendirmek\nÇalışanların sağlık gözetimini sağlamak'],
        ['Çalışanın hak ve yükümlülükleri', 'Eğitimlere katılmak ve talimatlara uymak\nKişisel koruyucu donanımları doğru kullanmak\nTehlikeleri derhal amirine bildirmek\nCiddi ve yakın tehlikede çalışmaktan kaçınma hakkı (Madde 13)'],
      ]),
      slides('tr1-l2', 'Tehlike kaynakları ve korunma', 20, [
        ['Fiziksel risk etmenleri', 'Gürültü ve titreşim\nYetersiz aydınlatma, sıcak ve soğuk ortamlar\nToz, duman ve radyasyon'],
        ['Kimyasal ve biyolojik riskler', 'Maruziyet solunum, cilt ve sindirim yoluyla olur\nKullanmadan önce Güvenlik Bilgi Formunu (GBF) okuyun\nEtiketsiz kaptaki maddeyi kesinlikle kullanmayın'],
        ['Ergonomi', 'Yük kaldırırken dizlerinizi bükün, belinizi düz tutun\nYükü vücudunuza yakın taşıyın\nAğır yükleri yardım alarak ya da ekipmanla taşıyın\nTekrarlı hareketlerde düzenli mola verin'],
        ['Kişisel koruyucu donanım (KKD)', 'KKD son savunma hattıdır; önce tehlike kaynağında önlem alınır\nBaret, gözlük, eldiven, iş ayakkabısı, kulak koruyucu\nHasarlı KKD kullanılmaz, derhal değiştirilir'],
      ]),
      video('tr1-l3', 'Acil durumlar ve tahliye', 5, 'Acil durum toplanma alanları, tahliye yolları ve alarm sinyalleri.'),
      slides('tr1-l4', 'İş kazası ve meslek hastalıkları', 15, [
        ['İş kazası nedir?', 'İşyerinde ya da işin yürütümü nedeniyle meydana gelen olay\nÇalışanı bedenen veya ruhen engelli hale getirebilir\nİşveren, kazayı 3 iş günü içinde SGK’ya bildirir'],
        ['Ramak kala olaylar', 'Zarar oluşmadan atlatılan olaylardır\nMutlaka bildirilmelidir; büyük kazaların habercisidir\nHer ağır kazanın arkasında yüzlerce ramak kala vardır'],
        ['Meslek hastalıkları', 'Tekrarlanan maruziyet sonucu zamanla ortaya çıkar\nGürültüye bağlı işitme kaybı, pnömokonyoz, kas-iskelet hastalıkları\nPeriyodik sağlık muayeneleri erken teşhis sağlar'],
      ]),
    ],
    [
      q('tr1-q1', '6331 sayılı Kanun’a göre risk değerlendirmesi yaptırmak kimin yükümlülüğüdür?', ['Çalışanın', 'Sendikanın', 'İşverenin', 'SGK’nın'], 2),
      q('tr1-q2', 'Tehlike ile risk arasındaki fark nedir?', ['Tehlike zarar verme potansiyelidir; risk bu zararın gerçekleşme ihtimalidir', 'İkisi aynı anlama gelir', 'Risk yalnızca kimyasallar için kullanılır', 'Tehlike her zaman riskten küçüktür'], 0),
      q('tr1-q3', 'Kişisel koruyucu donanımlar için hangisi doğrudur?', ['İlk alınması gereken önlemdir', 'Yalnızca ziyaretçiler kullanır', 'Hasarlı olsa da kullanılabilir', 'Son savunma hattıdır'], 3),
      q('tr1-q4', 'Ciddi ve yakın tehlike durumunda çalışanın hakkı nedir?', ['Hiçbir hakkı yoktur', 'Tehlike giderilene kadar çalışmaktan kaçınabilir', 'Yalnızca sözlü uyarı yapabilir', 'İşten çıkarılır'], 1),
      q('tr1-q5', 'Yük kaldırırken doğru duruş hangisidir?', ['Bel bükülü, dizler düz', 'Yük vücuttan uzakta', 'Dizler bükülü, bel düz', 'Ani ve hızlı hareketle'], 2),
      q('tr1-q6', 'Ramak kala olay nedir?', ['Zarar oluşmadan atlatılan olay', 'Ölümlü iş kazası', 'Meslek hastalığı', 'Yangın tatbikatı'], 0),
      q('tr1-q7', 'İş kazası SGK’ya en geç ne zaman bildirilmelidir?', ['Bir ay içinde', 'Bildirilmesi gerekmez', 'Bir hafta içinde', '3 iş günü içinde'], 3),
      q('tr1-q8', 'Etiketi olmayan bir kaptaki kimyasal için doğru davranış hangisidir?', ['Koklayarak tanımaya çalışmak', 'Kullanmamak ve amire bildirmek', 'Su ile seyreltip kullanmak', 'Başka bir kaba aktarmak'], 1),
      q('tr1-q9', 'Gürültüye bağlı işitme kaybı hangi gruba girer?', ['İş kazası', 'Ramak kala', 'Meslek hastalığı', 'Ergonomik risk değildir'], 2),
      q('tr1-q10', 'Acil tahliye sırasında hangisi yapılmamalıdır?', ['Toplanma alanına gitmek', 'Asansör kullanmak', 'Talimatlara uymak', 'Sakin kalmak'], 1),
    ],
    5,
    15,
  ),

  /* ---------------- Yangın ---------------- */
  tr2: content(
    [
      slides('tr2-l1', 'Yangının oluşumu ve sınıfları', 10, [
        ['Yangın üçgeni', 'Yanıcı madde + ısı + oksijen bir araya gelince yangın başlar\nBu üç unsurdan biri ortadan kaldırılırsa yangın söner'],
        ['Yangın sınıfları', 'A: Katı maddeler (odun, kağıt, kumaş)\nB: Sıvılar (benzin, boya, solvent)\nC: Gazlar (doğalgaz, LPG)\nD: Metaller   ·   F: Yemek yağları'],
        ['Elektrik yangınları', 'Önce elektriği kesin\nSu ile müdahale etmeyin\nKarbondioksitli (CO₂) ya da kuru kimyevi tozlu söndürücü kullanın'],
      ]),
      video('tr2-l2', 'Yangın söndürücü kullanımı', 5, 'Pimi çek, hortumu ateşin dibine yönelt, tetiği sık, süpürür gibi sağa sola hareket ettir.'),
      slides('tr2-l3', 'Tahliye ve toplanma', 8, [
        ['Yangın anında', 'Sakin olun ve alarmı verin (112)\nKüçük yangına güvenliyseniz müdahale edin\nKapıları kapatarak yangının yayılmasını yavaşlatın'],
        ['Dumanlı ortamda', 'Eğilerek ya da emekleyerek ilerleyin\nAğzınızı ıslak bezle kapatın\nKapıyı açmadan önce elinizin tersiyle sıcaklığını kontrol edin'],
        ['Toplanma alanı', 'Asansör kullanmayın, merdivenleri kullanın\nToplanma alanında sayım için bekleyin\nİzin verilmeden binaya geri dönmeyin'],
      ]),
    ],
    [
      q('tr2-q1', 'Yangın üçgeninin unsurları nelerdir?', ['Su, hava, ateş', 'Yanıcı madde, ısı, oksijen', 'Duman, alev, kül', 'Elektrik, gaz, yağ'], 1),
      q('tr2-q2', 'Odun ve kağıt yangınları hangi sınıftadır?', ['A', 'B', 'C', 'F'], 0),
      q('tr2-q3', 'Elektrik yangınına ilk müdahalede ne yapılmalıdır?', ['Su dökülmeli', 'Kapı açılmalı', 'Elektrik kesilmeli', 'Pencere kırılmalı'], 2),
      q('tr2-q4', 'Dumanlı ortamda nasıl ilerlenmelidir?', ['Koşarak', 'Eğilerek ya da emekleyerek', 'Asansörle', 'Gözler kapalı'], 1),
      q('tr2-q5', 'Yemek yağı yangınları hangi sınıftadır?', ['A', 'C', 'D', 'F'], 3),
      q('tr2-q6', 'Söndürücü kullanırken hortum nereye yöneltilir?', ['Alevin tepesine', 'Ateşin dibine', 'Dumana', 'Tavana'], 1),
    ],
    3,
    10,
  ),

  /* ---------------- İlk yardım ---------------- */
  tr3: content(
    [
      slides('tr3-l1', 'İlk yardımın temel uygulamaları', 15, [
        ['İlk yardımın temel adımları', 'Koruma: olay yerini ve kendinizi güvene alın\nBildirme: 112’yi arayın, net bilgi verin\nKurtarma: hastaya hızlı ve doğru müdahale'],
        ['Hasta değerlendirme', 'Bilinç kontrolü: seslenin, omzuna dokunun\nHava yolunu açın: baş geri, çene yukarı\nSolunumu 10 saniye bak-dinle-hisset ile kontrol edin'],
        ['Temel yaşam desteği', 'Solunum yoksa 112’yi arayın\n30 göğüs basısı + 2 suni solunum\nBası hızı dakikada 100–120, derinlik 5–6 cm'],
      ]),
      slides('tr3-l2', 'Kanamalar, yanıklar ve kırıklar', 15, [
        ['Kanamalar', 'Yaranın üzerine temiz bezle doğrudan baskı uygulayın\nKanayan bölgeyi kalp seviyesinin üstüne kaldırın\nTurnike yalnızca son çare olarak uygulanır'],
        ['Yanıklar', 'Yanık bölgeyi en az 10–20 dakika ılık suyla soğutun\nYapışmış giysileri çıkarmayın\nKrem, diş macunu gibi maddeler sürmeyin'],
        ['Kırık ve çıkıklar', 'Kırık bölgeyi hareket ettirmeyin\nBir üst ve bir alt eklemi içine alacak şekilde tespit edin\nAçık kırıkta yarayı temiz bezle kapatın'],
      ]),
    ],
    [
      q('tr3-q1', 'İlk yardımın temel adımlarının doğru sırası hangisidir?', ['Kurtarma, bildirme, koruma', 'Koruma, bildirme, kurtarma', 'Bildirme, kurtarma, koruma', 'Kurtarma, koruma, bildirme'], 1),
      q('tr3-q2', 'Yetişkinde kalp masajı ve suni solunum oranı nedir?', ['15:2', '5:1', '30:2', '10:1'], 2),
      q('tr3-q3', 'Dış kanamada ilk yapılacak uygulama hangisidir?', ['Turnike uygulamak', 'Doğrudan baskı uygulamak', 'Yarayı yıkamak', 'Hastayı yürütmek'], 1),
      q('tr3-q4', 'Yanık bölge nasıl soğutulmalıdır?', ['Buz ile', 'Diş macunu ile', '10–20 dakika ılık su ile', 'Hiç soğutulmamalı'], 2),
      q('tr3-q5', 'Solunum kontrolü ne kadar sürede yapılır?', ['10 saniye', '1 dakika', '3 saniye', '5 dakika'], 0),
      q('tr3-q6', 'Kırık bölgenin tespitinde hangisi doğrudur?', ['Kırık yer düzeltilmeye çalışılır', 'Bir üst ve bir alt eklem içine alınır', 'Bölge ovulur', 'Tespite gerek yoktur'], 1),
    ],
    3,
    10,
  ),

  /* ---------------- Yüksekte çalışma ---------------- */
  tr4: content(
    [
      slides('tr4-l1', 'Düşmeden korunma', 12, [
        ['Yüksekte çalışma nedir?', 'Düşme riski olan her seviye farkı yüksekte çalışmadır\nİnşaat iş kazalarının en büyük payı düşmelerdir'],
        ['Korunma hiyerarşisi', 'Önce: işi yerde yapmanın yolunu arayın\nToplu koruma: korkuluk, güvenlik ağı\nSon olarak: tam vücut emniyet kemeri'],
        ['Emniyet kemeri kullanımı', 'Tam vücut tipi kemer kullanın\nAnkraj noktası başınızın üstünde ve sağlam olmalı\nHer kullanımdan önce kemeri kontrol edin'],
      ]),
      slides('tr4-l2', 'İskele güvenliği', 10, [
        ['İskele kurulumu', 'Yalnızca yetkili kişilerce kurulur\nZemin sağlam ve düz olmalı\nKurulum sonrası yeşil etiketle kullanıma açılır'],
        ['Kullanım kuralları', 'Korkuluk ve topukluk tahtası eksiksiz olmalı\nİskele üzerinde malzeme biriktirmeyin\nKırmızı etiketli iskeleyi kullanmayın'],
      ]),
    ],
    [
      q('tr4-q1', 'Yüksekte çalışmada ilk tercih edilmesi gereken önlem hangisidir?', ['Emniyet kemeri', 'İşi yerde yapmanın yolunu aramak', 'Güvenlik ağı', 'Baret'], 1),
      q('tr4-q2', 'Ankraj noktası nerede olmalıdır?', ['Ayak seviyesinde', 'Bel hizasında', 'Başın üstünde ve sağlam bir yerde', 'Fark etmez'], 2),
      q('tr4-q3', 'Kırmızı etiketli iskele ne anlama gelir?', ['Kullanıma hazır', 'Kullanılmamalı', 'Sadece öğleden sonra kullanılır', 'Yeni boyanmış'], 1),
      q('tr4-q4', 'Hangi emniyet kemeri tipi kullanılmalıdır?', ['Bel kemeri', 'Tam vücut tipi', 'Tek kancalı halat', 'Göğüs kemeri'], 1),
      q('tr4-q5', 'İskeleyi kimler kurabilir?', ['Herkes', 'Yalnızca yetkili kişiler', 'Ziyaretçiler', 'Stajyerler'], 1),
    ],
    3,
    8,
  ),

  /* ---------------- Kimyasallar ---------------- */
  tr5: content(
    [
      slides('tr5-l1', 'GBF ve etiketleme', 10, [
        ['Güvenlik Bilgi Formu (GBF)', 'Her kimyasal için 16 bölümlük bilgi belgesidir\nTehlikeler, KKD, ilk yardım ve depolama bilgisi içerir\nKullanmadan önce mutlaka okuyun'],
        ['Tehlike piktogramları', 'Kırmızı çerçeveli elmas şeklindedir\nAlev: yanıcı · Kurukafa: akut toksik · Aşınma: korozif\nÜnlem işareti: tahriş edici'],
      ]),
      slides('tr5-l2', 'Depolama ve döküntü müdahalesi', 10, [
        ['Güvenli depolama', 'Birbiriyle tepkimeye girebilen kimyasalları ayrı depolayın\nYanıcıları ısı kaynaklarından uzak tutun\nKapları her zaman kapalı ve etiketli tutun'],
        ['Döküntü anında', 'Alanı boşaltın ve amirinize haber verin\nUygun KKD ile döküntü kitini kullanın\nAtıkları tehlikeli atık olarak bertaraf edin'],
      ]),
    ],
    [
      q('tr5-q1', 'Güvenlik Bilgi Formu kaç bölümden oluşur?', ['4', '10', '16', '24'], 2),
      q('tr5-q2', 'Kurukafa piktogramı neyi ifade eder?', ['Yanıcı', 'Akut toksik', 'Çevreye zararlı', 'Basınçlı gaz'], 1),
      q('tr5-q3', 'Kimyasal döküntüde ilk yapılacak hangisidir?', ['Su ile yıkamak', 'Alanı boşaltıp amire haber vermek', 'Üzerine toz dökmek', 'Görmezden gelmek'], 1),
      q('tr5-q4', 'Yanıcı kimyasallar nasıl depolanmalıdır?', ['Isı kaynaklarından uzakta', 'Kalorifer yanında', 'Açık kaplarda', 'Etiketsiz'], 0),
      q('tr5-q5', 'Tepkimeye girebilen kimyasallar için doğru depolama hangisidir?', ['Aynı rafta', 'Ayrı ayrı', 'Karıştırılarak', 'Fark etmez'], 1),
    ],
    3,
    8,
  ),

  /* ---------------- Ergonomi ---------------- */
  tr6: content(
    [
      slides('tr6-l1', 'Ekranlı araçlarla çalışma', 8, [
        ['Doğru oturuş', 'Sırtınızı sandalyeye tam yaslayın\nAyaklarınız yere tam basmalı\nDirsekleriniz yaklaşık 90 derece olmalı'],
        ['Ekran yerleşimi', 'Ekranın üst kenarı göz hizasında ya da biraz altında\nEkran ile göz arası 50–70 cm\nPencereye dik konumlandırın, yansımayı önleyin'],
      ]),
      slides('tr6-l2', 'Göz sağlığı ve molalar', 6, [
        ['20-20-20 kuralı', 'Her 20 dakikada bir\n20 saniye boyunca\n6 metre (20 feet) uzağa bakın'],
        ['Mola ve egzersiz', 'Her saat kısa bir ara verin\nBoyun ve omuz esneme hareketleri yapın\nGün içinde bol su için'],
      ]),
    ],
    [
      q('tr6-q1', 'Ekran ile göz arasındaki uygun mesafe nedir?', ['10–20 cm', '50–70 cm', '1,5 metre', 'Fark etmez'], 1),
      q('tr6-q2', '20-20-20 kuralında 20 saniye boyunca ne yapılır?', ['Gözler kapatılır', 'Uzağa bakılır', 'Ekrana yaklaşılır', 'Su içilir'], 1),
      q('tr6-q3', 'Ekranın üst kenarı nerede olmalıdır?', ['Göz hizasında ya da biraz altında', 'Göz hizasının çok üstünde', 'Masa seviyesinde', 'Diz hizasında'], 0),
      q('tr6-q4', 'Klavye kullanırken dirsek açısı yaklaşık kaç derece olmalıdır?', ['45', '90', '135', '180'], 1),
      q('tr6-q5', 'Ekran pencereye göre nasıl konumlandırılmalıdır?', ['Pencereye dik', 'Pencereye bakacak şekilde', 'Pencereye sırtı dönük', 'Fark etmez'], 0),
    ],
    3,
    6,
  ),
};
