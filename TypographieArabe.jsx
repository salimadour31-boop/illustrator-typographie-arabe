//@target illustrator
/*
 * TypographieArabe.jsx — v1.0.0
 * Typographie arabe en une passe pour Illustrator / One-pass Arabic typography clean-up for Illustrator
 *
 * FR : Le texte arabe reçu des clients (Word, WhatsApp, e-mail, sites Web) arrive plein de petites
 *      fautes de composition : virgule, point-virgule et point d'interrogation latins (, ; ?) au lieu
 *      de ، ؛ ؟, espaces avant la ponctuation ou à l'intérieur des parenthèses, espace manquante
 *      après la ponctuation, conjonction « و » détachée du mot suivant, espaces doubles, lettres
 *      persanes (ی ک) tapées sur un clavier persan, chiffres mélangés (0-9 / ٠-٩ / ۰-۹), caractères
 *      de contrôle invisibles (LRM, RLM, ZWSP…) qui dérèglent le sens du texte.
 *      Illustrator n'a ni GREP ni correcteur typographique arabe : ce script applique ces règles
 *      selon le contexte (seulement à côté de l'arabe, jamais dans un mot ou un nombre latin), sans
 *      toucher à la mise en forme (chaque caractère garde ses attributs).
 * EN : Arabic copy received from clients (Word, WhatsApp, e-mail, websites) is full of small
 *      typesetting mistakes: Latin comma, semicolon and question mark (, ; ?) instead of ، ؛ ؟,
 *      spaces before punctuation or inside brackets, missing space after punctuation, the
 *      conjunction "و" detached from the next word, double spaces, Persian letters (ی ک) from a
 *      Persian keyboard, mixed digit sets, invisible bidi control characters (LRM, RLM, ZWSP…).
 *      Illustrator has no GREP and no Arabic typography fixer: this script applies those rules by
 *      context (only next to Arabic, never inside a Latin word or number) and keeps formatting
 *      (every character keeps its attributes).
 *
 * Auteur / Author : Amirouche Amwanes — Licence MIT / MIT License
 * Cible / Target : Adobe Illustrator CC 2018+ (ExtendScript ES3). Non testé dans Illustrator.
 * Aucun appel réseau, aucune collecte de données. / No network calls, no data collection.
 * Conseil : travaillez sur une copie du document. / Tip: work on a copy of your document.
 */

/* ===================================================================== */
/*  1. CŒUR TEXTE (pur, sans Illustrator) / PURE TEXT CORE                */
/*     Travaille sur des chaînes ; testable hors Illustrator (Node).      */
/*     Works on plain strings; testable outside Illustrator (Node).       */
/* ===================================================================== */

var TA_CORE = (function () {

    // Espaces horizontales reconnues / horizontal spaces we recognise (tabs excluded)
    var SPACES = "\u0020\u00A0\u2009\u202F\u200A\u2002\u2003\u2004\u2005\u2006\u2007\u2008";
    // Espaces « ordinaires » que l'on fusionne / ordinary spaces that get merged
    var PLAIN = "\u0020\u00A0";

    var TATWEEL = "\u0640";
    var AR_COMMA = "\u060C", AR_SEMI = "\u061B", AR_QUEST = "\u061F", AR_PCT = "\u066A";
    var AR_DEC = "\u066B", AR_THOU = "\u066C";
    var WAW = "\u0648";

    // Fermants / ouvrants (ordre logique) / closing and opening marks (logical order)
    var CLOSERS = ")]}\u00BB\u201D\u2019\"'";
    var OPENERS = "([{\u00AB\u201C\u2018\"'";
    var CLOSE_BR = ")]}\u00BB\u201D";          // pas les guillemets droits / no straight quotes
    var OPEN_BR = "([{\u00AB\u201C";

    // Caractères de contrôle invisibles retirés (ZWNJ U+200C et ZWJ U+200D sont gardés)
    // Invisible controls removed (ZWNJ and ZWJ are kept: they are used on purpose)
    var CTRL = [0x200B, 0xFEFF, 0x200E, 0x200F, 0x202A, 0x202B, 0x202C, 0x202D, 0x202E,
        0x2066, 0x2067, 0x2068, 0x2069, 0x061C];

    // Lettres qui n'existent qu'en persan / ourdou : leur présence protège le paragraphe
    // Persian / Urdu-only letters: their presence protects the paragraph
    var GUARD = [0x067E, 0x0686, 0x0698, 0x06AF, 0x0679, 0x0688, 0x0691, 0x06BA, 0x06D2];

    function code(c) { return (c === undefined || c === "") ? -1 : c.charCodeAt(0); }
    function inSet(set, c) { return c !== undefined && c !== "" && set.indexOf(c) >= 0; }
    function inCodes(arr, n) { for (var i = 0; i < arr.length; i++) if (arr[i] === n) return true; return false; }
    function isSpace(c) { return inSet(SPACES, c); }
    function isPlain(c) { return inSet(PLAIN, c); }

    // Lettre arabe (y compris formes de présentation), sans le tatwīl
    // Arabic letter (incl. presentation forms), tatweel excluded
    function isArLetter(c) {
        var n = code(c);
        return (n >= 0x0620 && n <= 0x063F) || (n >= 0x0641 && n <= 0x064A) || n === 0x066E || n === 0x066F ||
            (n >= 0x0671 && n <= 0x06D3) || n === 0x06D5 || n === 0x06EE || n === 0x06EF ||
            (n >= 0x06FA && n <= 0x06FC) || n === 0x06FF || (n >= 0x0750 && n <= 0x077F) ||
            (n >= 0x08A0 && n <= 0x08C9) || (n >= 0xFB50 && n <= 0xFDFF) || (n >= 0xFE70 && n <= 0xFEFC);
    }
    // Signes diacritiques arabes (voyelles, chadda, signes coraniques) / Arabic combining marks
    function isArMark(c) {
        var n = code(c);
        return (n >= 0x064B && n <= 0x065F) || n === 0x0670 || (n >= 0x06D6 && n <= 0x06DC) ||
            (n >= 0x06DF && n <= 0x06E4) || n === 0x06E7 || n === 0x06E8 || (n >= 0x06EA && n <= 0x06ED) ||
            (n >= 0x08CA && n <= 0x08FF);
    }
    function isTashkeel(c) { var n = code(c); return n >= 0x064B && n <= 0x0652; }
    function isIndic(c) { var n = code(c); return n >= 0x0660 && n <= 0x0669; }
    function isPersianDigit(c) { var n = code(c); return n >= 0x06F0 && n <= 0x06F9; }
    function isWDigit(c) { return c !== undefined && c !== "" && c >= "0" && c <= "9" && c.length === 1; }
    function isAnyDigit(c) { return isWDigit(c) || isIndic(c) || isPersianDigit(c); }
    function isLatin(c) {
        if (c === undefined || c === "") return false;
        return /[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u0370-\u03FF\u0400-\u04FF\u1E00-\u1EFF]/.test(c);
    }
    function isArWordChar(c) { return isArLetter(c) || isArMark(c) || c === TATWEEL; }

    // Nature d'un caractère : ar (arabe, chiffres arabes compris), lat, dig (0-9), none, other
    // Character kind: ar (Arabic incl. Arabic digits), lat, dig (0-9), none, other
    function kind(c) {
        if (c === undefined || c === "") return "none";
        if (isArWordChar(c) || isIndic(c) || isPersianDigit(c)) return "ar";
        if (isLatin(c)) return "lat";
        if (isWDigit(c)) return "dig";
        return "other";
    }
    // Nature du premier caractère « fort » avant / après j (espaces et guillemets sautés)
    // Kind of the first meaningful character before / after j (spaces and brackets skipped)
    function prevKind(t, j) {
        var k = j - 1;
        while (k >= 0 && (isSpace(t.charAt(k)) || inSet(CLOSERS, t.charAt(k)))) k--;
        return k < 0 ? "none" : kind(t.charAt(k));
    }
    function nextKind(t, j) {
        var k = j + 1;
        while (k < t.length && (isSpace(t.charAt(k)) || inSet(OPENERS, t.charAt(k)))) k++;
        return k >= t.length ? "none" : kind(t.charAt(k));
    }

    function hasArabic(s) {
        for (var i = 0; i < s.length; i++) if (isArLetter(s.charAt(i))) return true;
        return false;
    }
    function hasGuard(s) {
        for (var i = 0; i < s.length; i++) if (inCodes(GUARD, s.charCodeAt(i))) return true;
        return false;
    }

    // Mot (suite sans espace) autour de j / whitespace-delimited token around j
    function token(t, j) {
        var a = j, b = j;
        while (a > 0 && !isSpace(t.charAt(a - 1)) && t.charAt(a - 1) !== "\t") a--;
        while (b < t.length && !isSpace(t.charAt(b)) && t.charAt(b) !== "\t") b++;
        return t.substring(a, b);
    }

    // Découpe en paragraphes (\r, \n ou retour forcé U+0003) avec positions
    // Split into paragraphs / lines (\r, \n or forced line break U+0003) with offsets
    function paragraphs(s) {
        var out = [], start = 0, i, c;
        for (i = 0; i <= s.length; i++) {
            c = s.charAt(i);
            if (i === s.length || c === "\r" || c === "\n" || c === "\u0003") {
                out.push({ start: start, end: i, text: s.substring(start, i) });
                start = i + 1;
            }
        }
        return out;
    }
    // Seuls les paragraphes contenant de l'arabe sont traités / only paragraphs with Arabic letters
    function arabicParas(s) {
        var ps = paragraphs(s), out = [];
        for (var k = 0; k < ps.length; k++) if (ps[k].text.length && hasArabic(ps[k].text)) out.push(ps[k]);
        return out;
    }

    // Une seule modification par index / one edit per index
    function addEdit(map, list, e) {
        if (map["i" + e.index]) return false;
        map["i" + e.index] = true; list.push(e); return true;
    }
    function bump(counts, key) { counts[key] = (counts[key] || 0) + 1; }

    // Applique les modifications à une chaîne (index décroissants) / applies edits (descending)
    function applyEdits(s, edits) {
        var sorted = edits.slice(0).sort(function (a, b) { return b.index - a.index; });
        for (var i = 0; i < sorted.length; i++) {
            var e = sorted[i];
            if (e.type === "replace") s = s.substring(0, e.index) + e.ch + s.substring(e.index + 1);
            else if (e.type === "insert") s = s.substring(0, e.index) + e.ch + s.substring(e.index);
            else if (e.type === "remove") s = s.substring(0, e.index) + s.substring(e.index + 1);
        }
        return s;
    }

    /* ---------- Passe 1 : caractères de contrôle invisibles / invisible controls ---------- */
    function passControls(s, o, counts) {
        var edits = [], map = {}, ps, k, j;
        if (!o.controls) return edits;
        ps = arabicParas(s);
        for (k = 0; k < ps.length; k++) {
            var t = ps[k].text;
            for (j = 0; j < t.length; j++) {
                if (inCodes(CTRL, t.charCodeAt(j)) && addEdit(map, edits, { type: "remove", index: ps[k].start + j })) bump(counts, "controls");
            }
        }
        return edits;
    }

    /* ---------- Passe 2 : lettres persanes, tatwīl, voyelles / Persian letters, tatweel, vowels ---------- */
    function passLetters(s, o, counts) {
        var edits = [], map = {}, ps = arabicParas(s), k, j;
        for (k = 0; k < ps.length; k++) {
            var t = ps[k].text, off = ps[k].start;
            var persianOk = o.persian && !hasGuard(t);
            for (j = 0; j < t.length; j++) {
                var c = t.charAt(j), n = code(c);
                if (persianOk) {
                    if (n === 0x06A9) { if (addEdit(map, edits, { type: "replace", index: off + j, ch: "\u0643" })) bump(counts, "persian"); continue; }
                    if (n === 0x06BE || n === 0x06C1) { if (addEdit(map, edits, { type: "replace", index: off + j, ch: "\u0647" })) bump(counts, "persian"); continue; }
                    if (n === 0x06CC) {
                        // ی persan : avec points s'il est lié à la lettre suivante (ي), sans points en fin de mot (ى)
                        // Persian yeh: dotted when joined to the next letter (ي), dotless at word end (ى)
                        var m = j + 1;
                        while (m < t.length && isArMark(t.charAt(m))) m++;
                        var joined = isArLetter(t.charAt(m)) || t.charAt(m) === TATWEEL;
                        if (addEdit(map, edits, { type: "replace", index: off + j, ch: joined ? "\u064A" : "\u0649" })) bump(counts, "persian");
                        continue;
                    }
                }
                if (o.tatweel && c === TATWEEL) {
                    // Seulement à l'intérieur d'un mot (pas le tatwīl utilisé comme tiret entre deux nombres)
                    // Only inside a word (not a tatweel used as a dash between numbers)
                    var a = j - 1, b = j + 1;
                    while (a >= 0 && (isArMark(t.charAt(a)) || t.charAt(a) === TATWEEL)) a--;
                    while (b < t.length && (isArMark(t.charAt(b)) || t.charAt(b) === TATWEEL)) b++;
                    if (isArLetter(t.charAt(a)) && isArLetter(t.charAt(b)) && addEdit(map, edits, { type: "remove", index: off + j })) bump(counts, "tatweel");
                    continue;
                }
                if (o.tashkeel && isTashkeel(c)) {
                    if (addEdit(map, edits, { type: "remove", index: off + j })) bump(counts, "tashkeel");
                }
            }
        }
        return edits;
    }

    /* ---------- Passe 3 : chiffres / digits ---------- */
    // Lettre la plus proche (arabe ou latine) d'une position : sert à savoir si un nombre est dans l'arabe
    // Nearest letter (Arabic or Latin) to a position: tells whether a number sits in Arabic
    function nearestLetterKind(t, a, b) {
        var i = a - 1, j = b, di = 0, dj = 0, ki = "none", kj = "none";
        while (i >= 0) { var ci = kind(t.charAt(i)); if ((ci === "ar" && !isAnyDigit(t.charAt(i))) || ci === "lat") { ki = ci; break; } i--; di++; }
        while (j < t.length) { var cj = kind(t.charAt(j)); if ((cj === "ar" && !isAnyDigit(t.charAt(j))) || cj === "lat") { kj = cj; break; } j++; dj++; }
        if (ki === "none") return kj;
        if (kj === "none") return ki;
        return di <= dj ? ki : kj;
    }

    function passDigits(s, o, counts) {
        var edits = [], map = {}, ps, k, j;
        if (o.digits !== "latin" && o.digits !== "indic") return edits;
        ps = arabicParas(s);
        var dec = o.decimal === "." ? "." : ",", thou = dec === "," ? "." : ",";
        for (k = 0; k < ps.length; k++) {
            var t = ps[k].text, off = ps[k].start;
            j = 0;
            while (j < t.length) {
                if (!isAnyDigit(t.charAt(j))) { j++; continue; }
                // Nombre : chiffres et séparateurs internes / number: digits and inner separators
                var a = j, b = j;
                while (b < t.length && (isAnyDigit(t.charAt(b)) ||
                    (inSet(".,\u066B\u066C", t.charAt(b)) && isAnyDigit(t.charAt(b - 1)) && isAnyDigit(t.charAt(b + 1))))) b++;
                var changed = false, i2;
                if (o.digits === "latin") {
                    for (i2 = a; i2 < b; i2++) {
                        var c = t.charAt(i2), n = code(c), r = null;
                        if (isIndic(c)) r = String.fromCharCode(48 + n - 0x0660);
                        else if (isPersianDigit(c)) r = String.fromCharCode(48 + n - 0x06F0);
                        else if (c === AR_DEC) r = dec;
                        else if (c === AR_THOU) r = thou;
                        if (r !== null && addEdit(map, edits, { type: "replace", index: off + i2, ch: r })) changed = true;
                    }
                    var p = b;
                    if (t.charAt(p) === AR_PCT) { if (addEdit(map, edits, { type: "replace", index: off + p, ch: "%" })) changed = true; }
                } else {
                    var tok = token(t, a);
                    var skip = /[A-Za-z\u00C0-\u024F@]|:\/\/|www\./.test(tok) || nearestLetterKind(t, a, b) === "lat";
                    if (!skip) {
                        for (i2 = a; i2 < b; i2++) {
                            var c2 = t.charAt(i2), n2 = code(c2), r2 = null;
                            if (isWDigit(c2)) r2 = String.fromCharCode(0x0660 + n2 - 48);
                            else if (isPersianDigit(c2)) r2 = String.fromCharCode(0x0660 + n2 - 0x06F0);
                            else if (c2 === dec) r2 = AR_DEC;
                            else if (c2 === thou) r2 = AR_THOU;
                            if (r2 !== null && addEdit(map, edits, { type: "replace", index: off + i2, ch: r2 })) changed = true;
                        }
                        var q = b;
                        if (isPlain(t.charAt(q)) && t.charAt(q + 1) === "%") q++;
                        if (t.charAt(q) === "%" && addEdit(map, edits, { type: "replace", index: off + q, ch: AR_PCT })) changed = true;
                    }
                }
                if (changed) bump(counts, "digits");
                j = b;
            }
        }
        return edits;
    }

    /* ---------- Passe 4 : ponctuation latine → arabe, guillemets / Latin → Arabic punctuation, quotes ---------- */
    // Une , ; ? latine appartient-elle à l'arabe ? / does a Latin , ; ? belong to Arabic text?
    function belongsToArabic(t, j) {
        if (isAnyDigit(t.charAt(j - 1)) && isAnyDigit(t.charAt(j + 1))) return false;   // 3,5 / ١,٥
        var tok = token(t, j);
        if (/:\/\/|www\.|@|=/.test(tok)) return false;                                   // URL, e-mail
        var pk = prevKind(t, j), nk = nextKind(t, j);
        if (pk === "ar" && nk !== "lat") return true;
        if (pk === "dig" && nk === "ar") return true;                                     // en 2024, كان
        return false;
    }

    function passPunct(s, o, counts) {
        var edits = [], map = {}, ps = arabicParas(s), k, j;
        for (k = 0; k < ps.length; k++) {
            var t = ps[k].text, off = ps[k].start;
            if (o.punct) {
                for (j = 0; j < t.length; j++) {
                    var c = t.charAt(j), to = c === "," ? AR_COMMA : (c === ";" ? AR_SEMI : (c === "?" ? AR_QUEST : null));
                    if (to && belongsToArabic(t, j) && addEdit(map, edits, { type: "replace", index: off + j, ch: to })) bump(counts, "punct");
                }
            }
            if (o.quotes) {
                var pos = [];
                for (j = 0; j < t.length; j++) if (t.charAt(j) === "\"") pos.push(j);
                if (pos.length && pos.length % 2 === 0) {
                    for (j = 0; j < pos.length; j += 2) {
                        var inner = t.substring(pos[j] + 1, pos[j + 1]);
                        if (!hasArabic(inner)) continue;
                        if (isSpace(t.charAt(pos[j] + 1)) && isSpace(t.charAt(pos[j + 1] - 1)) && inner.replace(/\s/g, "").length === 0) continue;
                        if (addEdit(map, edits, { type: "replace", index: off + pos[j], ch: "\u00AB" }) &&
                            addEdit(map, edits, { type: "replace", index: off + pos[j + 1], ch: "\u00BB" })) bump(counts, "quotes");
                    }
                }
            }
        }
        return edits;
    }

    /* ---------- Passe 5 : ponctuation répétée / repeated punctuation ---------- */
    function passRepeat(s, o, counts) {
        var edits = [], map = {}, ps = arabicParas(s), k, j;
        for (k = 0; k < ps.length; k++) {
            var t = ps[k].text, off = ps[k].start;
            for (j = 1; j < t.length; j++) {
                var c = t.charAt(j);
                if (c !== t.charAt(j - 1)) continue;
                // ،، et ؛؛ sont toujours des fautes ; ؟؟ et !! seulement si l'option est cochée
                // ،، and ؛؛ are always mistakes; ؟؟ and !! only when the option is on
                var always = o.punct && (c === AR_COMMA || c === AR_SEMI);
                var a = j - 1;
                while (a > 0 && t.charAt(a - 1) === c) a--;
                var optional = o.repeat && (c === AR_QUEST || (c === "!" && prevKind(t, a) === "ar"));
                if ((always || optional) && addEdit(map, edits, { type: "remove", index: off + j })) bump(counts, "repeat");
            }
        }
        return edits;
    }

    /* ---------- Passe 6 : espaces / spaces ---------- */
    var NO_SPACE_BEFORE = "\u060C\u061B\u061F!.:\u2026,;?" + CLOSE_BR;
    var SPACE_AFTER = "\u060C\u061B\u061F!:";

    // Nombre de lettres arabes juste avant j / Arabic letters right before j
    function arLettersBefore(t, j) {
        var n = 0, i = j - 1;
        while (i >= 0 && (isArLetter(t.charAt(i)) || isArMark(t.charAt(i)) || t.charAt(i) === TATWEEL)) { if (isArLetter(t.charAt(i))) n++; i--; }
        return n;
    }

    function passSpaces(s, o, counts) {
        var edits = [], map = {}, ps = arabicParas(s), k, j, r;
        for (k = 0; k < ps.length; k++) {
            var t = ps[k].text, off = ps[k].start;
            for (j = 0; j < t.length; j++) {
                var c = t.charAt(j), prev = t.charAt(j - 1), next = t.charAt(j + 1);

                // a) Pas d'espace avant la ponctuation ni avant un fermant / no space before punctuation or a closer
                if (o.spBefore && inSet(NO_SPACE_BEFORE, c) && isSpace(prev)) {
                    var m = j;
                    while (m > 0 && isSpace(t.charAt(m - 1))) m--;
                    if (m > 0 && prevKind(t, j) === "ar") {
                        var ok = true;
                        if ((c === "." || c === ",") && isAnyDigit(next)) ok = false;         // .5
                        if (c === ":" && isAnyDigit(next)) ok = false;                         // :30
                        if (c === "." && next === "." && t.charAt(j + 2) !== ".") ok = false;  // ..
                        if (ok) {
                            var did = false;
                            for (r = m; r < j; r++) if (addEdit(map, edits, { type: "remove", index: off + r })) did = true;
                            if (did) bump(counts, "spBefore");
                        }
                    }
                }
                // b) Pas d'espace après un ouvrant suivi d'arabe / no space after an opener followed by Arabic
                if (o.spBefore && inSet(OPEN_BR, c) && isSpace(next)) {
                    var e = j + 1;
                    while (e < t.length && isSpace(t.charAt(e))) e++;
                    if (kind(t.charAt(e)) === "ar") {
                        var did2 = false;
                        for (r = j + 1; r < e; r++) if (addEdit(map, edits, { type: "remove", index: off + r })) did2 = true;
                        if (did2) bump(counts, "spBefore");
                    }
                }
                // c) Espace manquante après la ponctuation et autour des parenthèses
                //    Missing space after punctuation and around brackets
                if (o.spAfter && isArLetter(next)) {
                    var need = false;
                    if (inSet(SPACE_AFTER, c)) need = !(c === ":" && isAnyDigit(prev));
                    else if (c === "\u2026") need = true;
                    else if (c === ".") need = prev === "." || arLettersBefore(t, j) >= 2;     // د.محمد reste / abbreviations kept
                    else if (inSet(CLOSE_BR, c)) need = true;
                    if (need && addEdit(map, edits, { type: "insert", index: off + j + 1, ch: " " })) bump(counts, "spAfter");
                }
                if (o.spAfter && inSet(OPEN_BR, c) && isArWordChar(prev)) {
                    var close = { "(": ")", "[": "]", "{": "}", "\u00AB": "\u00BB", "\u201C": "\u201D" }[c];
                    if (t.indexOf(close, j) > j && addEdit(map, edits, { type: "insert", index: off + j, ch: " " })) bump(counts, "spAfter");
                }
                // d) Conjonction و détachée : « و الطالب » → « والطالب » / detached conjunction waw
                if (o.waw && c === WAW && !isArWordChar(prev) && !isAnyDigit(prev)) {
                    var w = j + 1;
                    while (w < t.length && isArMark(t.charAt(w))) w++;
                    if (isSpace(t.charAt(w))) {
                        var e2 = w;
                        while (e2 < t.length && isSpace(t.charAt(e2))) e2++;
                        if (isArLetter(t.charAt(e2))) {
                            var did3 = false;
                            for (r = w; r < e2; r++) if (addEdit(map, edits, { type: "remove", index: off + r })) did3 = true;
                            if (did3) bump(counts, "waw");
                        }
                    }
                }
            }
            // e) Espaces multiples, en début et en fin de paragraphe / multiple, leading and trailing spaces
            if (o.spMulti) {
                j = 0;
                while (j < t.length) {
                    if (!isPlain(t.charAt(j))) { j++; continue; }
                    var a2 = j, b2 = j;
                    while (b2 < t.length && isPlain(t.charAt(b2))) b2++;
                    var from = -1;
                    if (a2 === 0 || b2 === t.length) from = a2;                                // début / fin
                    else if (b2 - a2 >= 2 && (kind(t.charAt(a2 - 1)) === "ar" || kind(t.charAt(b2)) === "ar")) from = a2 + 1;
                    if (from >= 0) {
                        var did4 = false;
                        for (r = from; r < b2; r++) if (addEdit(map, edits, { type: "remove", index: off + r })) did4 = true;
                        if (did4) bump(counts, "spMulti");
                    }
                    j = b2;
                }
            }
        }
        return edits;
    }

    // Les chiffres passent en dernier : leurs mots sont alors définitifs / digits last, once tokens are final
    var PASSES = [passControls, passLetters, passPunct, passRepeat, passSpaces, passDigits];

    var KEYS = ["controls", "persian", "tatweel", "tashkeel", "digits", "punct", "quotes", "repeat", "spBefore", "spAfter", "waw", "spMulti"];
    function newCounts() { var c = {}; for (var i = 0; i < KEYS.length; i++) c[KEYS[i]] = 0; return c; }
    function total(c) { var n = 0; for (var i = 0; i < KEYS.length; i++) n += c[KEYS[i]] || 0; return n; }

    // Simulation complète sur une chaîne / full simulation on a string
    // Deux tours : une correction peut en rendre une autre possible (ex. espace ajoutée puis chiffre)
    // Two rounds: one fix can enable another (e.g. a space added, then a number converted)
    var ROUNDS = 2;
    function simulate(s, o) {
        var counts = newCounts(), cur = s;
        for (var r = 0; r < ROUNDS; r++)
            for (var i = 0; i < PASSES.length; i++) cur = applyEdits(cur, PASSES[i](cur, o, counts));
        return { text: cur, counts: counts };
    }

    // Exemples avant → après (paragraphes modifiés, extrait autour de la 1re différence)
    // Before → after examples (changed paragraphs, excerpt around the first difference)
    function examples(before, after, max) {
        var pb = paragraphs(before), pa = paragraphs(after), out = [];
        if (pb.length !== pa.length) return out;
        for (var i = 0; i < pb.length && out.length < max; i++) {
            var x = pb[i].text, y = pa[i].text;
            if (x === y) continue;
            var d = 0;
            while (d < x.length && d < y.length && x.charAt(d) === y.charAt(d)) d++;
            var a = Math.max(0, d - 18);
            out.push({ before: x.substr(a, 40), after: y.substr(a, 40) });
        }
        return out;
    }

    return {
        PASSES: PASSES, ROUNDS: ROUNDS, KEYS: KEYS, newCounts: newCounts, total: total, simulate: simulate, examples: examples,
        applyEdits: applyEdits, paragraphs: paragraphs, hasArabic: hasArabic, belongsToArabic: belongsToArabic,
        nearestLetterKind: nearestLetterKind, kind: kind
    };
})();

/* ===================================================================== */
/*  2. COUCHE ILLUSTRATOR / ILLUSTRATOR LAYER                             */
/* ===================================================================== */

var TA_FR = (function () {
    try { return String(app.locale || $.locale).toLowerCase().indexOf("fr") === 0; } catch (e) { return true; }
})();
function TA_t(fr, en) { return TA_FR ? fr : en; }

// Réglages par défaut (prudents) / safe defaults
var TA_DEFAULTS = {
    scope: "sel",
    punct: true, spBefore: true, spAfter: true, repeat: false, quotes: false,
    spMulti: true, waw: true,
    persian: true, tatweel: false, tashkeel: false, controls: true,
    digits: "keep", decimal: ","
};

/* ---------- Réglages mémorisés (fichier local) / saved settings (local file) ---------- */
function TA_cfgFile() { return new File(Folder.userData + "/TypographieArabe.cfg"); }
function TA_loadCfg() {
    var o = {}, k;
    for (k in TA_DEFAULTS) if (TA_DEFAULTS.hasOwnProperty(k)) o[k] = TA_DEFAULTS[k];
    try {
        var f = TA_cfgFile();
        if (f.exists && f.open("r")) {
            while (!f.eof) {
                var line = f.readln(), p = line.indexOf("=");
                if (p < 1) continue;
                k = line.substring(0, p); var v = line.substring(p + 1);
                if (!TA_DEFAULTS.hasOwnProperty(k)) continue;
                if (typeof TA_DEFAULTS[k] === "boolean") o[k] = (v === "true"); else o[k] = v;
            }
            f.close();
        }
    } catch (e) {}
    return o;
}
function TA_saveCfg(o) {
    try {
        var f = TA_cfgFile();
        if (f.open("w")) { for (var k in TA_DEFAULTS) if (TA_DEFAULTS.hasOwnProperty(k)) f.writeln(k + "=" + o[k]); f.close(); }
    } catch (e) {}
}

/* ---------- Objets modifiables / editable items ---------- */
function TA_editable(item) {
    try { if (item.locked || item.hidden) return false; } catch (e) {}
    try { if (item.editable === false) return false; } catch (e2) {}
    var p = null;
    try { p = item.parent; } catch (e3) {}
    while (p && p.typename !== "Document") {
        try {
            if (p.typename === "Layer") { if (p.locked || !p.visible) return false; }
            else if (p.locked || p.hidden) return false;
        } catch (e4) {}
        p = p.parent;
    }
    return true;
}

function TA_inLayer(item, layer) {
    var p = item.parent;
    while (p && p.typename !== "Document") {
        if (p === layer || (p.typename === "Layer" && p.name === layer.name && p.parent === layer.parent)) return true;
        p = p.parent;
    }
    return false;
}

function TA_collect(items, out) {
    for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (it.typename === "TextFrame") out.push(it);
        else if (it.typename === "GroupItem") TA_collect(it.pageItems, out);
    }
}

function TA_key(tf) {
    var k = "";
    try { k = tf.position[0].toFixed(2) + "," + tf.position[1].toFixed(2) + "," + tf.contents.length; } catch (e) {}
    return k;
}

/*
 * Cibles : { get(): TextRange, frame, fixed } ; les blocs liés sont traités une fois par article.
 * Targets; threaded frames are processed once per story.
 */
function TA_targets(doc, scope, info) {
    var frames = [], targets = [], seen = {}, i;
    info.skipped = 0; info.noSel = false;
    if (scope === "sel") {
        var sel = doc.selection;
        if (sel && sel.typename === "TextRange") {
            var fr = null;
            try { fr = sel.story.textFrames[0]; } catch (e) {}
            targets.push({ get: (function (r) { return function () { return r; }; })(sel), frame: fr, fixed: true });
            return targets;
        }
        if (!sel || sel.length === 0) { info.noSel = true; return targets; }
        TA_collect(sel, frames);
    } else {
        var all = doc.textFrames, lay = doc.activeLayer;
        for (i = 0; i < all.length; i++) {
            if (scope === "layer" && !TA_inLayer(all[i], lay)) continue;
            frames.push(all[i]);
        }
    }
    for (i = 0; i < frames.length; i++) {
        var tf = frames[i];
        if (!TA_editable(tf)) { info.skipped++; continue; }
        var head = tf, guard = 0;
        try { while (head.previousFrame && guard++ < 500) head = head.previousFrame; } catch (e5) {}
        var threaded = false;
        try { threaded = head !== tf || !!head.nextFrame; } catch (e6) {}
        if (threaded) { var key = TA_key(head); if (seen[key]) continue; seen[key] = true; }
        targets.push({
            get: (function (h, th) { return function () { return th ? h.story.textRange : h.textRange; }; })(head, threaded),
            frame: head, fixed: false
        });
    }
    return targets;
}

function TA_sum(a, b) { for (var k in b) if (b.hasOwnProperty(k)) a[k] = (a[k] || 0) + b[k]; }

/* ---------- Analyse (aucune modification) / analysis (no changes) ---------- */
function TA_analyse(targets, o) {
    var tot = TA_CORE.newCounts(), changed = [], bad = 0, ex = [];
    for (var i = 0; i < targets.length; i++) {
        var R = targets[i].get(), s = String(R.contents);
        if (!TA_CORE.hasArabic(s)) continue;
        if (R.characters.length !== s.length) { bad++; continue; }
        var sim = TA_CORE.simulate(s, o);
        if (TA_CORE.total(sim.counts) > 0) {
            changed.push(targets[i]);
            if (ex.length < 5) { var e = TA_CORE.examples(s, sim.text, 5 - ex.length); for (var j = 0; j < e.length; j++) ex.push(e[j]); }
        }
        TA_sum(tot, sim.counts);
    }
    return { counts: tot, changed: changed, bad: bad, total: targets.length, examples: ex };
}

/* ---------- Application / apply ---------- */
function TA_applyTarget(T, o, totals) {
    var R = T.get(), s = String(R.contents), i, j;
    if (!TA_CORE.hasArabic(s)) return;
    if (R.characters.length !== s.length) { totals.bad++; return; }
    for (var round = 0; round < TA_CORE.ROUNDS; round++) for (i = 0; i < TA_CORE.PASSES.length; i++) {
        var ed = TA_CORE.PASSES[i](s, o, totals.counts);
        if (!ed.length) continue;
        ed.sort(function (a, b) { return b.index - a.index; });
        for (j = 0; j < ed.length; j++) {
            var e = ed[j], c = R.characters[e.index];
            // Chaque caractère modifié garde ses attributs (police, corps, couleur…)
            // Every edited character keeps its attributes (font, size, colour…)
            if (e.type === "replace") c.contents = e.ch;
            else if (e.type === "insert") c.contents = e.ch + c.contents;
            else if (e.type === "remove") c.remove();
        }
        var expected = TA_CORE.applyEdits(s, ed);
        if (!T.fixed) R = T.get();
        s = String(R.contents);
        // Sécurité : on s'arrête si Illustrator n'a pas donné le résultat attendu
        // Safety: stop if Illustrator did not produce the expected text
        if (s !== expected || R.characters.length !== s.length) { totals.mismatch++; return; }
    }
    totals.done++;
}

/* ---------- Rapport / report ---------- */
function TA_report(c, extra, ex) {
    var L = [];
    function line(fr, en, v) { if (v) L.push("\u2022 " + TA_t(fr, en) + " : " + v); }
    line("Caractères de contrôle invisibles retirés", "Invisible control characters removed", c.controls);
    line("Lettres persanes / ourdoues converties", "Persian / Urdu letters converted", c.persian);
    line("Tatwīl (ـ) supprimés", "Tatweels (ـ) removed", c.tatweel);
    line("Voyelles (tachkīl) supprimées", "Vowel marks removed", c.tashkeel);
    line("Nombres convertis", "Numbers converted", c.digits);
    line("Ponctuations latines → \u060C \u061B \u061F", "Latin punctuation → \u060C \u061B \u061F", c.punct);
    line("Guillemets droits → « »", "Straight quotes → « »", c.quotes);
    line("Ponctuations répétées réduites", "Repeated punctuation reduced", c.repeat);
    line("Espaces fautives (avant ponctuation, dans parenthèses)", "Wrong spaces (before punctuation, inside brackets)", c.spBefore);
    line("Espaces manquantes ajoutées", "Missing spaces added", c.spAfter);
    line("Conjonction \u0648 recollée", "Conjunction \u0648 re-attached", c.waw);
    line("Espaces multiples / début / fin nettoyées", "Multiple / leading / trailing spaces cleaned", c.spMulti);
    if (!L.length) L.push(TA_t("Rien à corriger avec ces réglages.", "Nothing to fix with these settings."));
    if (extra) L.push(extra);
    if (ex && ex.length) {
        L.push(TA_t("Exemples (avant → après) :", "Examples (before → after):"));
        for (var i = 0; i < ex.length; i++) L.push("  " + ex[i].before + "  \u2192  " + ex[i].after);
    }
    return L.join("\n");
}

/* ---------- Dialogue / dialog ---------- */
function TA_dialog(doc, o) {
    var w = new Window("dialog", TA_t("Typographie arabe — nettoyage du texte", "Arabic typography — text clean-up"));
    w.orientation = "column"; w.alignChildren = ["fill", "top"]; w.spacing = 8; w.margins = 14;

    var pS = w.add("panel", undefined, TA_t("Portée", "Scope"));
    pS.orientation = "row"; pS.margins = [10, 14, 10, 8];
    var rSel = pS.add("radiobutton", undefined, TA_t("Sélection", "Selection"));
    var rLay = pS.add("radiobutton", undefined, TA_t("Calque actif", "Active layer"));
    var rDoc = pS.add("radiobutton", undefined, TA_t("Document", "Document"));
    rSel.value = o.scope === "sel"; rLay.value = o.scope === "layer"; rDoc.value = o.scope === "doc";

    var pP = w.add("panel", undefined, TA_t("Ponctuation (seulement à côté de l'arabe)", "Punctuation (only next to Arabic)"));
    pP.alignChildren = ["left", "top"]; pP.margins = [10, 14, 10, 8];
    var cPun = pP.add("checkbox", undefined, TA_t("Remplacer , ; ? latins par \u060C \u061B \u061F (et \u060C\u060C → \u060C)", "Replace Latin , ; ? with \u060C \u061B \u061F (and \u060C\u060C → \u060C)"));
    var cBef = pP.add("checkbox", undefined, TA_t("Supprimer les espaces avant la ponctuation et à l'intérieur des ( ) [ ] « »", "Remove spaces before punctuation and inside ( ) [ ] « »"));
    var cAft = pP.add("checkbox", undefined, TA_t("Ajouter l'espace manquante après \u060C \u061B \u061F ! : . et autour des parenthèses", "Add the missing space after \u060C \u061B \u061F ! : . and around brackets"));
    var cRep = pP.add("checkbox", undefined, TA_t("Réduire \u061F\u061F\u061F et !!! à un seul signe", "Reduce \u061F\u061F\u061F and !!! to one mark"));
    var cQuo = pP.add("checkbox", undefined, TA_t("Guillemets droits \"…\" → « … » autour du texte arabe", "Straight quotes \"…\" → « … » around Arabic text"));
    cPun.value = o.punct; cBef.value = o.spBefore; cAft.value = o.spAfter; cRep.value = o.repeat; cQuo.value = o.quotes;

    var pW = w.add("panel", undefined, TA_t("Espaces et mots", "Spaces and words"));
    pW.alignChildren = ["left", "top"]; pW.margins = [10, 14, 10, 8];
    var cMul = pW.add("checkbox", undefined, TA_t("Espaces doubles, en début et en fin de paragraphe", "Double spaces, leading and trailing spaces"));
    var cWaw = pW.add("checkbox", undefined, TA_t("Recoller la conjonction \u0648 au mot suivant (\u0648 \u0627\u0644\u0637\u0627\u0644\u0628 → \u0648\u0627\u0644\u0637\u0627\u0644\u0628)", "Re-attach the conjunction \u0648 to the next word"));
    cMul.value = o.spMulti; cWaw.value = o.waw;

    var pL = w.add("panel", undefined, TA_t("Lettres et caractères", "Letters and characters"));
    pL.alignChildren = ["left", "top"]; pL.margins = [10, 14, 10, 8];
    var cPer = pL.add("checkbox", undefined, TA_t("Lettres de clavier persan \u06CC \u06A9 \u06C1 \u06BE → \u064A/\u0649 \u0643 \u0647 (paragraphes sans \u067E \u0686 \u0698 \u06AF…)", "Persian keyboard letters \u06CC \u06A9 \u06C1 \u06BE → \u064A/\u0649 \u0643 \u0647 (paragraphs without \u067E \u0686 \u0698 \u06AF…)"));
    var cCtl = pL.add("checkbox", undefined, TA_t("Retirer les caractères invisibles LRM, RLM, ZWSP, BOM… (ZWJ / ZWNJ gardés)", "Remove invisible LRM, RLM, ZWSP, BOM… (ZWJ / ZWNJ kept)"));
    var cTat = pL.add("checkbox", undefined, TA_t("Supprimer les tatwīl \u0640 tapés à la main dans les mots", "Remove hand-typed tatweels \u0640 inside words"));
    var cTas = pL.add("checkbox", undefined, TA_t("Supprimer les voyelles (tachkīl) — attention : irréversible hors annulation", "Remove vowel marks (tashkeel) — careful"));
    cPer.value = o.persian; cCtl.value = o.controls; cTat.value = o.tatweel; cTas.value = o.tashkeel;

    var pD = w.add("panel", undefined, TA_t("Chiffres du texte arabe (contenu, pas seulement l'affichage)", "Digits in Arabic text (content, not just display)"));
    pD.orientation = "row"; pD.alignChildren = ["left", "center"]; pD.margins = [10, 14, 10, 8];
    var ddDig = pD.add("dropdownlist", undefined, [
        TA_t("Ne pas changer", "Leave as is"),
        TA_t("Occidentaux 0123 (Maghreb)", "Western 0123 (Maghreb)"),
        TA_t("Arabes orientaux \u0660\u0661\u0662\u0663 (Machrek)", "Eastern Arabic \u0660\u0661\u0662\u0663 (Mashriq)")]);
    var DIG = ["keep", "latin", "indic"];
    ddDig.selection = Math.max(0, (function () { for (var i = 0; i < DIG.length; i++) if (DIG[i] === o.digits) return i; return 0; })());
    pD.add("statictext", undefined, TA_t("Séparateur décimal :", "Decimal mark:"));
    var ddDec = pD.add("dropdownlist", undefined, [TA_t("virgule  3,5", "comma  3,5"), TA_t("point  3.5", "point  3.5")]);
    ddDec.selection = o.decimal === "." ? 1 : 0;

    var note = w.add("statictext", undefined, TA_t("Les objets verrouillés ou masqués sont ignorés ; les paragraphes sans arabe ne sont jamais touchés. Travaillez sur une copie.",
        "Locked or hidden objects are skipped; paragraphs without Arabic are never touched. Work on a copy."), { multiline: true });
    note.preferredSize = [600, 32];

    var out = w.add("edittext", undefined, TA_t("Cliquez sur Analyser pour compter les corrections sans rien modifier.", "Click Analyse to count fixes without changing anything."),
        { multiline: true, readonly: true, scrolling: true });
    out.preferredSize = [600, 170];

    var gB = w.add("group"); gB.alignment = ["right", "top"];
    var bAn = gB.add("button", undefined, TA_t("Analyser", "Analyse"));
    var bSel = gB.add("button", undefined, TA_t("Sélectionner les textes à corriger", "Select texts to fix"));
    var bCancel = gB.add("button", undefined, TA_t("Fermer", "Close"), { name: "cancel" });
    var bOk = gB.add("button", undefined, TA_t("Appliquer", "Apply"), { name: "ok" });

    function read() {
        o.scope = rSel.value ? "sel" : (rLay.value ? "layer" : "doc");
        o.punct = cPun.value; o.spBefore = cBef.value; o.spAfter = cAft.value; o.repeat = cRep.value; o.quotes = cQuo.value;
        o.spMulti = cMul.value; o.waw = cWaw.value;
        o.persian = cPer.value; o.controls = cCtl.value; o.tatweel = cTat.value; o.tashkeel = cTas.value;
        o.digits = DIG[ddDig.selection ? ddDig.selection.index : 0];
        o.decimal = (ddDec.selection && ddDec.selection.index === 1) ? "." : ",";
    }
    function noTargetMsg(info) {
        return info.noSel ? TA_t("Rien n'est sélectionné : sélectionnez des textes ou choisissez Calque actif / Document.",
            "Nothing is selected: select text or choose Active layer / Document.")
            : TA_t("Aucun texte modifiable dans cette portée.", "No editable text in this scope.");
    }
    bAn.onClick = function () {
        read();
        var info = {}, T = TA_targets(doc, o.scope, info);
        if (!T.length) { out.text = noTargetMsg(info); return; }
        var a = TA_analyse(T, o);
        var extra = TA_t(a.changed.length + " texte(s) sur " + a.total + " à corriger", a.changed.length + " of " + a.total + " text(s) to fix");
        if (info.skipped) extra += TA_t(", " + info.skipped + " verrouillé(s) ou masqué(s) ignoré(s)", ", " + info.skipped + " locked/hidden skipped");
        if (a.bad) extra += TA_t(", " + a.bad + " ignoré(s) (caractères non indexables)", ", " + a.bad + " skipped (unindexable characters)");
        out.text = TA_report(a.counts, extra + ".", a.examples);
    };
    bSel.onClick = function () { read(); w.close(4); };
    bOk.onClick = function () { read(); w.close(1); };
    return w.show();
}

/* ---------- Point d'entrée / entry point ---------- */
function TA_main() {
    if (app.documents.length === 0) {
        alert(TA_t("Aucun document ouvert. Ouvrez un document Illustrator puis relancez le script.",
            "No document is open. Open an Illustrator document and run the script again."));
        return;
    }
    var doc = app.activeDocument, o = TA_loadCfg();
    var res = TA_dialog(doc, o);
    if (res !== 1 && res !== 4) return;
    TA_saveCfg(o);
    var info = {}, T = TA_targets(doc, o.scope, info);
    if (!T.length) {
        alert(info.noSel ? TA_t("Rien n'est sélectionné. Sélectionnez des blocs de texte (ou du texte avec l'outil Texte), ou choisissez Calque actif / Document.",
            "Nothing is selected. Select text frames (or text with the Type tool), or choose Active layer / Document.")
            : TA_t("Aucun texte modifiable dans cette portée.", "No editable text in this scope."));
        return;
    }
    if (res === 4) {
        var a = TA_analyse(T, o), frames = [];
        for (var k = 0; k < a.changed.length; k++) if (a.changed[k].frame) frames.push(a.changed[k].frame);
        try { doc.selection = null; if (frames.length) doc.selection = frames; } catch (eS) {}
        alert(TA_t(frames.length + " texte(s) à corriger sélectionné(s).", frames.length + " text(s) to fix selected."));
        return;
    }
    var totals = { counts: TA_CORE.newCounts(), done: 0, bad: 0, mismatch: 0, errors: 0 };
    for (var i = 0; i < T.length; i++) {
        try { TA_applyTarget(T[i], o, totals); } catch (e) { totals.errors++; }
    }
    app.redraw();
    var extra = TA_t(totals.done + " texte(s) arabe(s) traité(s)", totals.done + " Arabic text(s) processed");
    if (info.skipped) extra += TA_t(", " + info.skipped + " verrouillé(s) ou masqué(s) ignoré(s)", ", " + info.skipped + " locked/hidden skipped");
    if (totals.bad) extra += TA_t(", " + totals.bad + " ignoré(s) (caractères non indexables)", ", " + totals.bad + " skipped (unindexable characters)");
    if (totals.mismatch) extra += TA_t(", " + totals.mismatch + " arrêté(s) par sécurité (résultat inattendu)", ", " + totals.mismatch + " stopped for safety (unexpected result)");
    if (totals.errors) extra += TA_t(", " + totals.errors + " erreur(s)", ", " + totals.errors + " error(s)");
    alert(TA_report(totals.counts, extra + ".\n" + TA_t("Édition > Annuler (Ctrl+Z / Cmd+Z) pour revenir en arrière.", "Edit > Undo (Ctrl+Z / Cmd+Z) to revert.")));
}

if (typeof TA_NO_MAIN === "undefined") {
    try { TA_main(); } catch (err) { alert(TA_t("Erreur : ", "Error: ") + err + (err.line ? " (ligne " + err.line + ")" : "")); }
}
