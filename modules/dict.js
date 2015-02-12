module.exports = exports = function (app) {
    var b = app.bold;
    var request = app.utils.request;
    var cheerio = app.utils.cheerio;
    var useragent = app.utils.useragent;
    app.cmdRegister('urbandict', { "f": urbanDict,
        "h": "Gets first defintion from UrbanDictionary for a given term.",
    });
    function urbanDict(opt, callback) {
        request({
            uri: "http://api.urbandictionary.com/v0/define?term="+opt.cmd.join('+'),
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                if (res.list.length > 0) { 
                  callback(opt.to, b(opt.cmd.join(' ')+": ")+res.list[0].definition);
                }
            }
        });
    }
    app.cmdRegister('define', { "f": define,
        "h": "Gets first definition from reference.com for a given term.",
    });
    function define(opt, callback) {
        request({
            uri: "http://dictionary.reference.com/browse/"+opt.cmd.join('+'),
            headers: { 'User-Agent': useragent }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
         
                var def = $('div.def-content').first().text().replace(/(\r\n|\n|\r)/gm," ").trim();
                if (def) {
                  callback(opt.to, b(opt.cmd.join(' ')+": ")+def);
                }
            }
        });
    }
    app.cmdRegister('etym', { "f": etymology,
        "h": "Gets first etymology from etymonline.com for a given term.",
    });
    function etymology(opt, callback) {
        request({
            uri: "http://www.etymonline.com/index.php?search="+opt.cmd.join('+'),
            headers: { 'User-Agent': useragent }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
         
                var term = $('dt').first().text();
                var etym = $('dd').first().text();
                if (etym) {
                  callback(opt.to, b(term+": ")+etym);
                }
            }
        });
    }
    app.cmdRegister('thesaurus', { "f": thesaurus,
        "h": "A thesaurus, duh!",
    });
    function thesaurus(opt, callback) {
        request({
            uri: "http://www.collinsdictionary.com/dictionary/english-thesaurus/"+opt.cmd.join('-'),
            headers: { 'User-Agent': useragent }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
         
                var def = $('li.sense_list_item').first().text();
                if (def) {
                  callback(opt.to, b(opt.cmd.join(' ')+" ")+def);
                }
            }
        });
    }
    return module.id;
}
