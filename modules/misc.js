module.exports = exports = function (app) {
    var request = app.utils.request;
    var cheerio = app.utils.cheerio;
    var useragent = app.utils.useragent;
    var handler = function (opt, callback) {
        if(opt.subcmd && commands[opt.subcmd]) {
            commands[opt.subcmd](opt, callback);
        }
        else {
            callback(opt.to, "Misc. cmds: "+Object.keys(commands).join(', '));
        }
    }
    var commands = {
        "quote": quote,
        "slogan": slogan,
        "conv": convStarter,
    }
    app.cmdRegister('misc', { "f": handler,
        "h": "Contains miscellaneous subcommands that didn't fit in anywhere else."
    });
    function quote(opt, callback) {
        request({
            uri: "http://www.quotationspage.com/random.php3",
            headers: { 'User-Agent': useragent }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
         
                var quote = $('dt.quote').first().text();
                var author = $('dd.author').first().find('b').first().text();
                if (quote) {
                  callback(opt.to, quote+" --"+author);
                }
            }
        });
    }
    function slogan(opt, callback) {
        var word = opt.cmd.join('+');
        request({
            uri: "http://thesurrealist.co.uk/slogan?word="+(word?word:''),
            headers: { 'User-Agent': useragent }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
         
                var slogan = $('a.h1a').first().text();
                if (slogan) {
                  callback(opt.to, slogan);
                }
            }
        });
    }
    function convStarter(opt, callback) {
        request({
            uri: "http://www.conversationstarters.com/generator.php",
            headers: { 'User-Agent': useragent }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
         
                var randomTopic = $('div#random').text();
                if (randomTopic) {
                  callback(opt.to, randomTopic);
                }
            }
        });
    }
    return module.id;
}
