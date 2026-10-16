// Charge le script dans Node sans lancer Illustrator / loads the script in Node without Illustrator
var fs = require("fs"), vm = require("vm"), path = require("path");
module.exports = function (extra) {
    var src = fs.readFileSync(path.join(__dirname, "..", "TypographieArabe.jsx"), "utf8");
    var ctx = { TA_NO_MAIN: true, app: { locale: "fr_FR" }, $: { locale: "fr" }, alert: function () {} };
    if (extra) for (var k in extra) ctx[k] = extra[k];
    vm.createContext(ctx);
    vm.runInContext(src, ctx);
    return ctx;
};
