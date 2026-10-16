// Tests sur objets Illustrator simulés / tests on simulated Illustrator objects
// (ne remplacent pas un essai réel dans Illustrator / not a substitute for a real Illustrator test)
var load = require("./load.js");
var pass = 0, fail = 0;
function ok(name, cond) { if (cond) pass++; else { fail++; console.log("ÉCHEC / FAIL: " + name); } }

/* ---------- Modèle de texte simulé / simulated text model ---------- */
function Story(text, attr) {
    this.text = text; this.attrs = [];
    for (var i = 0; i < text.length; i++) this.attrs.push(attr || "normal");
    this.brokenRemove = false;
}
Story.prototype.setChar = function (i, s) {
    var a = this.attrs[i], add = [];
    for (var k = 0; k < s.length; k++) add.push(a);
    this.text = this.text.substring(0, i) + s + this.text.substring(i + 1);
    Array.prototype.splice.apply(this.attrs, [i, 1].concat(add));
};
Story.prototype.removeChar = function (i) {
    if (this.brokenRemove) return;
    this.text = this.text.substring(0, i) + this.text.substring(i + 1);
    this.attrs.splice(i, 1);
};
function CharRange(story, i) {
    return {
        get contents() { return story.text.charAt(i); },
        set contents(v) { story.setChar(i, v); },
        remove: function () { story.removeChar(i); },
        characterAttributes: { get attr() { return story.attrs[i]; } }
    };
}
function TextRange(story) {
    return {
        typename: "TextRange",
        get contents() { return story.text; },
        get characters() {
            return new Proxy({}, { get: function (t, p) {
                if (p === "length") return story.text.length;
                var n = Number(p); if (!isNaN(n)) return CharRange(story, n);
                return undefined;
            } });
        }
    };
}
var nextX = 0;
function Frame(text, layer, opt) {
    opt = opt || {};
    var story = opt.story || new Story(text, opt.attr);
    var f = {
        typename: "TextFrame", locked: !!opt.locked, hidden: !!opt.hidden, editable: true, parent: layer,
        position: [nextX++, 0], previousFrame: null, nextFrame: null, _story: story,
        get contents() { return story.text; },
        get textRange() { return TextRange(story); },
        story: null
    };
    f.story = { get textRange() { return TextRange(story); }, textFrames: [f] };
    return f;
}
function Doc() {
    var d = { typename: "Document", textFrames: [], selection: [] };
    d.layer = { typename: "Layer", name: "Calque 1", locked: false, visible: true, parent: d };
    d.hiddenLayer = { typename: "Layer", name: "Masqué", locked: false, visible: false, parent: d };
    d.activeLayer = d.layer;
    return d;
}

var O = { scope: "doc", punct: true, spBefore: true, spAfter: true, repeat: false, quotes: false, spMulti: true, waw: true,
    persian: true, tatweel: false, tashkeel: false, controls: true, digits: "keep", decimal: "," };

/* ---------- 1. Cibles, analyse, application / targets, analysis, apply ---------- */
(function () {
    var ctx = load();
    var d = Doc();
    var fA = Frame("الكتاب و القلم ,والدفتر", d.layer);
    var fB = Frame("Bonjour , le monde", d.layer);
    var fC = Frame("مرحبا ,صديقي", d.layer, { locked: true });
    var fD = Frame("مرحبا ,صديقي", d.hiddenLayer);
    var fE = Frame("نص سليم، بلا أخطاء.", d.layer);
    d.textFrames = [fA, fB, fC, fD, fE];
    var info = {}, T = ctx.TA_targets(d, "doc", info);
    ok("cibles : verrouillé et calque masqué ignorés", T.length === 3 && info.skipped === 2);
    var a = ctx.TA_analyse(T, O);
    ok("analyse : un seul texte à corriger", a.changed.length === 1 && a.changed[0].frame === fA);
    ok("analyse : rien modifié", fA.contents === "الكتاب و القلم ,والدفتر");
    ok("analyse : exemples", a.examples.length === 1);
    ok("analyse : compteurs", a.counts.waw === 1 && a.counts.punct === 1 && a.counts.spBefore === 1 && a.counts.spAfter === 1);
    var tot = { counts: ctx.TA_CORE.newCounts(), done: 0, bad: 0, mismatch: 0, errors: 0 };
    for (var i = 0; i < T.length; i++) ctx.TA_applyTarget(T[i], O, tot);
    ok("application : texte arabe corrigé", fA.contents === "الكتاب والقلم، والدفتر");
    ok("application : français intact", fB.contents === "Bonjour , le monde");
    ok("application : texte sain intact", fE.contents === "نص سليم، بلا أخطاء.");
    ok("application : compte", tot.done === 2 && tot.mismatch === 0);
    ok("application : identique à la simulation", fA.contents === ctx.TA_CORE.simulate("الكتاب و القلم ,والدفتر", O).text);
})();

/* ---------- 2. Mise en forme conservée / formatting kept ---------- */
(function () {
    var ctx = load();
    var d = Doc();
    var st = new Story("مرحبا ,كيف حالك ?");
    // « كيف » en gras / bold word
    for (var i = 7; i <= 9; i++) st.attrs[i] = "gras";
    var f = Frame(null, d.layer, { story: st });
    d.textFrames = [f];
    var T = ctx.TA_targets(d, "doc", {});
    var tot = { counts: ctx.TA_CORE.newCounts(), done: 0, bad: 0, mismatch: 0, errors: 0 };
    ctx.TA_applyTarget(T[0], O, tot);
    ok("forme : texte", f.contents === "مرحبا، كيف حالك؟");
    var w = f.contents.indexOf("كيف");
    ok("forme : mot en gras toujours en gras", st.attrs[w] === "gras" && st.attrs[w + 1] === "gras" && st.attrs[w + 2] === "gras");
    ok("forme : voisins normaux", st.attrs[w - 2] === "normal" && st.attrs[w + 3] === "normal");
    ok("forme : longueurs cohérentes", st.attrs.length === st.text.length);
})();

/* ---------- 3. Sécurité : résultat inattendu / safety stop ---------- */
(function () {
    var ctx = load();
    var d = Doc();
    var f = Frame("كلمة  كلمة", d.layer);
    f._story.brokenRemove = true;
    d.textFrames = [f];
    var T = ctx.TA_targets(d, "doc", {});
    var tot = { counts: ctx.TA_CORE.newCounts(), done: 0, bad: 0, mismatch: 0, errors: 0 };
    ctx.TA_applyTarget(T[0], O, tot);
    ok("sécurité : arrêt compté", tot.mismatch === 1 && tot.done === 0);
})();

/* ---------- 4. Blocs liés : traités une fois / threaded frames processed once ---------- */
(function () {
    var ctx = load();
    var d = Doc();
    var st = new Story("و الطالب ,درس");
    var f1 = Frame(null, d.layer, { story: st }), f2 = Frame(null, d.layer, { story: st });
    f1.nextFrame = f2; f2.previousFrame = f1;
    f1.story.textFrames = [f1, f2];
    d.textFrames = [f1, f2];
    var T = ctx.TA_targets(d, "doc", {});
    ok("liés : une seule cible", T.length === 1);
    var tot = { counts: ctx.TA_CORE.newCounts(), done: 0, bad: 0, mismatch: 0, errors: 0 };
    ctx.TA_applyTarget(T[0], O, tot);
    ok("liés : corrigé une fois", st.text === "والطالب، درس");
})();

/* ---------- 5. Portée sélection et calque / selection and layer scope ---------- */
(function () {
    var ctx = load();
    var d = Doc();
    var f1 = Frame("مرحبا ,صديقي", d.layer), f2 = Frame("مرحبا ,صديقي", d.layer);
    var other = { typename: "Layer", name: "Autre", locked: false, visible: true, parent: d };
    var f3 = Frame("مرحبا ,صديقي", other);
    var g = { typename: "GroupItem", pageItems: [f2], parent: d.layer, locked: false, hidden: false };
    d.textFrames = [f1, f2, f3];
    d.selection = [g];
    ok("sélection : groupe parcouru", ctx.TA_targets(d, "sel", {}).length === 1);
    d.selection = [];
    var info = {};
    ok("sélection vide signalée", ctx.TA_targets(d, "sel", info).length === 0 && info.noSel);
    ok("calque actif", ctx.TA_targets(d, "layer", {}).length === 2);
})();

/* ---------- 6. Point d'entrée avec dialogue simulé / entry point with simulated dialog ---------- */
function makeUI(result, clickAnalyse, logs) {
    function Control(type, text, items) {
        this.type = type; this.text = text; this.value = false; this.children = [];
        this.items = items || []; this._sel = null;
    }
    Object.defineProperty(Control.prototype, "selection", {
        get: function () { return this._sel; },
        set: function (v) { this._sel = (typeof v === "number") ? { index: v } : v; }
    });
    Control.prototype.add = function (type, b, text) {
        var c = new Control(type, typeof text === "string" ? text : "", Array.isArray(text) ? text : null);
        this.children.push(c); return c;
    };
    function Window(type, title) { Control.call(this, "window", title); }
    Window.prototype = Object.create(Control.prototype);
    Window.prototype.show = function () {
        var btns = [], outs = [];
        (function walk(c) { c.children.forEach(function (k) { if (k.type === "button") btns.push(k); if (k.type === "edittext") outs.push(k); walk(k); }); })(this);
        var w = this;
        w._res = result;
        w.close = function (n) { w._res = n; };
        if (clickAnalyse) { btns[0].onClick(); logs.push(outs[outs.length - 1].text); }
        if (result === 1) btns[3].onClick();
        if (result === 4) btns[1].onClick();
        return w._res;
    };
    return Window;
}
function FileMock() { this.exists = false; }
FileMock.prototype.open = function () { return false; };

(function () {
    var alerts = [], logs = [];
    var d = Doc();
    var f = Frame("السعر 250 دج , فقط", d.layer), fr = Frame("Prix : 250 DA", d.layer);
    d.textFrames = [f, fr]; d.selection = [f, fr];
    var appMock = { locale: "fr_FR", documents: { length: 1 }, activeDocument: d, redraw: function () {} };
    var ctx = load({ app: appMock, Window: makeUI(1, true, logs), File: FileMock, Folder: { userData: "/tmp" },
        alert: function (m) { alerts.push(m); } });
    ctx.TA_main();
    ok("main : analyse affichée", logs.length === 1 && logs[0].indexOf("1 texte(s) sur 2") >= 0);
    ok("main : appliqué", f.contents === "السعر 250 دج، فقط" && fr.contents === "Prix : 250 DA");
    ok("main : rapport final", alerts.length === 1 && alerts[0].indexOf("Annuler") >= 0);
})();
(function () {
    var alerts = [];
    var d = Doc();
    var f = Frame("مرحبا ,صديقي", d.layer), g = Frame("سليم.", d.layer);
    d.textFrames = [f, g]; d.selection = [f, g];
    var appMock = { locale: "en_US", documents: { length: 1 }, activeDocument: d, redraw: function () {} };
    var ctx = load({ app: appMock, $: { locale: "en" }, Window: makeUI(4, false, []), File: FileMock, Folder: { userData: "/tmp" },
        alert: function (m) { alerts.push(m); } });
    ctx.TA_main();
    ok("main : sélection des textes à corriger", Array.isArray(d.selection) && d.selection.length === 1 && d.selection[0] === f);
    ok("main : rien modifié en mode sélection", f.contents === "مرحبا ,صديقي");
    ok("main : message anglais", alerts.length === 1 && alerts[0].indexOf("selected") >= 0);
})();
(function () {
    var alerts = [];
    var ctx = load({ app: { locale: "fr_FR", documents: { length: 0 } }, alert: function (m) { alerts.push(m); } });
    ctx.TA_main();
    ok("main : aucun document", alerts.length === 1 && alerts[0].indexOf("Aucun document") === 0);
})();
(function () {
    var alerts = [];
    var d = Doc(); d.textFrames = [Frame("مرحبا ,صديقي", d.layer)]; d.selection = [];
    var ctx = load({ app: { locale: "fr_FR", documents: { length: 1 }, activeDocument: d, redraw: function () {} },
        Window: makeUI(1, false, []), File: FileMock, Folder: { userData: "/tmp" }, alert: function (m) { alerts.push(m); } });
    ctx.TA_main();
    ok("main : rien de sélectionné", alerts.length === 1 && alerts[0].indexOf("Rien n'est sélectionné") === 0);
})();

console.log("test-simulation : " + pass + " réussis, " + fail + " échoués");
process.exit(fail ? 1 : 0);
