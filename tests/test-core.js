// Tests du cœur texte (chaînes simulées) / pure text core tests
var C = require("./load.js")().TA_CORE;
var pass = 0, fail = 0;
var ALL = { punct: true, spBefore: true, spAfter: true, repeat: false, quotes: false, spMulti: true, waw: true,
    persian: true, tatweel: false, tashkeel: false, controls: true, digits: "keep", decimal: "," };
function opts(over) { var o = {}, k; for (k in ALL) o[k] = ALL[k]; for (k in (over || {})) o[k] = over[k]; return o; }
function eq(name, input, expected, over) {
    var got = C.simulate(input, opts(over)).text;
    if (got === expected) pass++;
    else { fail++; console.log("ÉCHEC / FAIL: " + name + "\n  entrée   : " + JSON.stringify(input) + "\n  attendu  : " + JSON.stringify(expected) + "\n  obtenu   : " + JSON.stringify(got)); }
}
function ok(name, cond) { if (cond) pass++; else { fail++; console.log("ÉCHEC / FAIL: " + name); } }

// Ponctuation / punctuation
eq("virgule collée", "مرحبا,كيف حالك?", "مرحبا، كيف حالك؟");
eq("virgule avec espaces", "كتاب , قلم", "كتاب، قلم");
eq("point-virgule", "أولا;ثانيا", "أولا؛ ثانيا");
eq("latin dans l'arabe", "زرت Paris, France", "زرت Paris, France");
eq("décimale arabe", "النسبة ٣,٥ بالمئة", "النسبة ٣,٥ بالمئة");
eq("décimale latine", "بلغ 3,5 مليون", "بلغ 3,5 مليون");
eq("année puis arabe", "في 2024, كان", "في 2024، كان");
eq("URL", "زوروا www.site.dz/?a=1,2 الآن", "زوروا www.site.dz/?a=1,2 الآن");
eq("e-mail (après du latin : gardé)", "راسلونا a@b.dz, شكرا", "راسلونا a@b.dz, شكرا");
eq("arabe puis latin", "مرحبا, Hello", "مرحبا, Hello");
eq("après parenthèse", "(نص)?", "(نص)؟");
eq("hébreu non touché", "שלום, עולם", "שלום, עולם");
eq("français non touché", "Bonjour , ça va ?  Oui", "Bonjour , ça va ?  Oui");
eq("paragraphes mixtes", "Bonjour , toi\rمرحبا ,صديقي", "Bonjour , toi\rمرحبا، صديقي");
eq("virgules doublées", "نعم،، لا", "نعم، لا");
eq("répétition désactivée", "حقا؟؟؟", "حقا؟؟؟");
eq("répétition activée", "حقا؟؟؟ رائع!!!", "حقا؟ رائع!", { repeat: true });
eq("!! latin non touché", "Super!!! مرحبا", "Super!!! مرحبا", { repeat: true });

// Espaces / spaces
eq("parenthèses intérieures", "قال ( نص ) هنا", "قال (نص) هنا");
eq("autour des parenthèses", "كلمة(نص)كلمة", "كلمة (نص) كلمة");
eq("guillemets « » intérieurs", "قال « مرحبا » له", "قال «مرحبا» له");
eq("espace avant point", "انتهى الدرس .", "انتهى الدرس.");
eq("espace après point", "انتهى.بدأ", "انتهى. بدأ");
eq("abréviation د.", "د.محمد", "د.محمد");
eq("deux-points", "ملاحظة :النص", "ملاحظة: النص");
eq("heure 10:30", "الساعة 10:30 صباحا", "الساعة 10:30 صباحا");
eq("espace avant !", "رائع !", "رائع!");
eq("points de suspension", "وهكذا ...ثم", "وهكذا... ثم");
eq("doubles espaces", "كلمة  كلمة   كلمة", "كلمة كلمة كلمة");
eq("début / fin", "  مرحبا  ", "مرحبا");
eq("doubles espaces latins gardés", "مرحبا\rA  B", "مرحبا\rA  B");
eq("tabulation gardée", "الاسم\tالسعر", "الاسم\tالسعر");
eq("retour forcé", "سطر ,\u0003سطر", "سطر،\u0003سطر");

// Conjonction و / conjunction waw
eq("و détaché", "و الطالب", "والطالب");
eq("و au milieu", "الكتاب و القلم", "الكتاب والقلم");
eq("و avec voyelle", "الكتاب وَ القلم", "الكتاب وَالقلم");
eq("و entre nombres", "5 و 6", "5 و 6");
eq("و dans un mot", "قلمو جديد", "قلمو جديد");
eq("و désactivé", "الكتاب و القلم", "الكتاب و القلم", { waw: false });
eq("و و", "و وجد", "ووجد");

// Lettres / letters
eq("kaf persan", "کتاب", "كتاب");
eq("yeh persan médian", "یوم", "يوم");
eq("yeh persan final", "علی", "على");
eq("garde persane", "پدر کتاب", "پدر کتاب");
eq("heh ourdou", "ہذا", "هذا");
eq("persan désactivé", "کتاب", "کتاب", { persian: false });
eq("tatwīl désactivé", "الرحيـــم", "الرحيـــم");
eq("tatwīl", "الرحيـــم", "الرحيم", { tatweel: true });
eq("tatwīl tiret", "١٩٩٠ـ٢٠٠٠ م", "١٩٩٠ـ٢٠٠٠ م", { tatweel: true });
eq("voyelles", "كَتَبَ الدَّرْسَ", "كتب الدرس", { tashkeel: true });
eq("contrôles", "\u200Fمرحبا\u200E \u200Bكلمة", "مرحبا كلمة");
eq("ZWNJ gardé", "مي\u200Cخواهم", "مي\u200Cخواهم", { persian: false });
eq("contrôles hors arabe gardés", "A\u200EB", "A\u200EB");

// Chiffres / digits
eq("vers occidentaux", "السعر ١٢٣٫٥ دج", "السعر 123,5 دج", { digits: "latin" });
eq("vers occidentaux point", "السعر ١٢٣٫٥ دج", "السعر 123.5 دج", { digits: "latin", decimal: "." });
eq("milliers ٬", "١٬٥٠٠ دج", "1.500 دج", { digits: "latin" });
eq("pourcent arabe", "نسبة ٥٠٪", "نسبة 50%", { digits: "latin" });
eq("chiffres persans", "صفحة ۴۵", "صفحة 45", { digits: "latin" });
eq("vers orientaux", "السعر 250 دج", "السعر ٢٥٠ دج", { digits: "indic" });
eq("A4 gardé", "ورق A4 أبيض", "ورق A4 أبيض", { digits: "indic" });
eq("COVID-19 gardé", "فيروس COVID-19 خطير", "فيروس COVID-19 خطير", { digits: "indic" });
eq("décimale orientale", "بلغ 3,5 مليون", "بلغ ٣٫٥ مليون", { digits: "indic" });
eq("pourcent oriental", "خصم 50% اليوم", "خصم ٥٠٪ اليوم", { digits: "indic" });
eq("chiffres français gardés", "Prix 250 DA\rالسعر 250", "Prix 250 DA\rالسعر ٢٥٠", { digits: "indic" });
eq("chiffres inchangés", "السعر ١٢٣", "السعر ١٢٣");

// Guillemets / quotes
eq("guillemets droits", "قال \"مرحبا\" ثم", "قال «مرحبا» ثم", { quotes: true });
eq("guillemets latins gardés", "قال \"Hello\" ثم", "قال \"Hello\" ثم", { quotes: true });
eq("guillemets impairs", "قال \"مرحبا ثم", "قال \"مرحبا ثم", { quotes: true });

// Propriétés générales / general properties
var sample = "  و الطالب ,درس(اللغة)بجد ?\rBonjour , toi !\rکتاب  ١٢٣ ;قال « نعم »";
var r1 = C.simulate(sample, opts({ digits: "latin", repeat: true }));
var r2 = C.simulate(r1.text, opts({ digits: "latin", repeat: true }));
ok("idempotent", r1.text === r2.text);
ok("paragraphe français intact", r1.text.split("\r")[1] === "Bonjour , toi !");
ok("compteurs", r1.counts.waw === 1 && r1.counts.punct >= 3 && r1.counts.persian === 1 && r1.counts.digits === 1);
var ex = C.examples(sample, r1.text, 5);
ok("exemples", ex.length === 2 && ex[0].before !== ex[0].after);
ok("rien à faire", C.total(C.simulate("مرحبا، كيف حالك؟", opts()).counts) === 0);

// Fuzz : textes aléatoires / random texts
var POOL = ["م", "ر", "ح", "ب", "ا", "و", "ی", "ک", "ـ", "َ", "١", "٢", "1", "2", "a", "B", "é", " ", " ", "  ", ",", ";", "?", "!", ".", ":", "(", ")", "«", "»", "\"", "%", "٪", "\u200F", "\u200C", "\r", "\t", "\u0003", "-", "/", "@"];
var seed = 7; function rnd(n) { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; }
var fuzzBad = 0, nonArBad = 0, paraBad = 0, idemBad = 0;
for (var f = 0; f < 3000; f++) {
    var len = 1 + rnd(40), s = "";
    for (var q = 0; q < len; q++) s += POOL[rnd(POOL.length)];
    var o = opts({ digits: ["keep", "latin", "indic"][rnd(3)], repeat: !!rnd(2), quotes: !!rnd(2), tatweel: !!rnd(2), tashkeel: !!rnd(2) });
    var res;
    try { res = C.simulate(s, o); } catch (e) { fuzzBad++; continue; }
    var pa = C.paragraphs(s), pb = C.paragraphs(res.text);
    if (pa.length !== pb.length) { paraBad++; continue; }
    for (var z = 0; z < pa.length; z++) if (!C.hasArabic(pa[z].text) && pa[z].text !== pb[z].text) nonArBad++;
    var again = C.simulate(res.text, o).text;
    if (again !== res.text) { idemBad++; if (idemBad <= 12) console.log("  non idempotent: " + JSON.stringify(s) + " -> " + JSON.stringify(res.text) + " -> " + JSON.stringify(again) + " " + JSON.stringify(o)); }
}
ok("fuzz : aucune exception", fuzzBad === 0);
ok("fuzz : nombre de paragraphes conservé", paraBad === 0);
ok("fuzz : paragraphes sans arabe jamais modifiés", nonArBad === 0);
ok("fuzz : deuxième passage sans changement (idempotent)", idemBad === 0);

console.log("test-core : " + pass + " réussis, " + fail + " échoués");
process.exit(fail ? 1 : 0);
