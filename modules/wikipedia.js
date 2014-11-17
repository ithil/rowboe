module.exports = exports = function (app) {
    var request = app.utils.request;
    var cheerio = app.utils.cheerio;
    var Google = require('google');
    var pat = new RegExp('([a-zA-Z]+)\.wikipedia.org/wiki/(.+)$');
    app.cmdRegister('wikipedia', { "f": wikiGoogle,
        "h": "Outputs Wikipedia abstract to a given topic.",
    });
    function wikiGoogle(opt, callback) {
        Google("site:en.wikipedia.org "+opt.cmd.join(' '), function (err, next, links) {
            if(!err && links[0]) {
                var link = links[0].link;
                var match = pat.exec(link);
                if(match[2]) {
                    opt.query = match[2];
                    wikipedia(opt, function (abstr) {callback(opt.to, abstr);});
                }
            }
        });
    }
    function wikipedia(opt, callback) {
        request({
            uri: "http://"+(opt.lang?opt.lang:"en")+".wikipedia.org/w/api.php?action=query&redirects=&prop=extracts&format=json&exintro=&explaintext=&exsentences="+(opt.sentences?opt.sentences:2)
            +"&titles="+opt.query,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                var pages = res.query.pages;
                var abstr = pages[Object.keys(pages)[0]].extract;
         
                if (abstr) {
                  callback(abstr);
                }
            }
        });
    }
    function wikipediaPreview(link, opt, callback) {
        var match = pat.exec(link);
        if(match[2]) {
            opt.query = match[2];
            opt.sentences = 1;
            opt.lang = match[1];
            wikipedia(opt, function (abstr) {callback(opt.to, abstr);});
        }
    }
    app.plugins('link-preview', {
        re: new RegExp(pat),
        f: wikipediaPreview
    })
    return module.id;
}
