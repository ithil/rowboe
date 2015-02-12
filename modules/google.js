module.exports = exports = function (app) {
    var b = app.bold;
    var Google = require('google');
    var request = app.utils.request;
    var useragent = app.utils.useragent;
    var handler = function (opt, callback) {
        if(opt.subcmd && subcommands[opt.subcmd]) {
            subcommands[opt.subcmd](opt, callback);
        }
        else if(!opt.subcmd) {
            google(opt, callback);
        }
    }
    var subcommands = {
        "image": images,
        "all": function (opt, callback) {
            opt.all = true;
            google(opt, callback);
        },
        "images": function (opt, callback) {
            opt.all = true;
            images(opt, callback);
        },
        "suggest": suggest,
    }
    function google(opt, callback) {
        var all = opt.all || false;
        Google(opt.cmd.join(' '), function (err, next, links) {
        for(var i=0; i < (all?10:1); i++) {
          if(links[i]) {
              if(links[i].link) {
                  callback(opt.to, links[i].link+b(links[i].title));
              }
          }
        }
        });
    }
    app.cmdRegister('google', { "f": handler,
        "h": "Returns first Google result. Use :all to get the first 10 results.",
    });
    function images(opt, callback) {
        var all = opt.all || false;
        var query = opt.cmd.join('+');
        request({
            uri: "http://ajax.googleapis.com/ajax/services/search/images?v=1.0&q="+query,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                if (res.responseData.results.length > 0) { 
                    callback(opt.to, res.responseData.results[0].url);
                }
            }
        });
    }
    function translate(opt, callback) {
        var query = opt.cmd.join('+');
        if(query.length > 350) {
            callback(opt.to, "Text must be under 350 characters.");
            return;
        }
        request({
            uri: "http://translate.google.com/translate_a/t?client=t&sl=auto&tl=en&q="+query,
            headers: { 'User-Agent': useragent }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                while(RegExp(',,').test(body)) {
                    body = body.replace(RegExp('\\,\\,', "g"), ',null,');
                    body = body.replace(RegExp('\\[\\,', "g"), '[null,');
                }
                var res = JSON.parse(body);
                var language = res[2] || '?';
                var text = res[0][0][0];
                callback(opt.to, text+b(' ('+language+')'));
            }
        });
    }
    app.cmdRegister('translate', { "f": translate,
        "h": "Uses Google Translate to translate a given text into English.",
    });
    function suggest(opt, callback) {
        var query = opt.cmd.join(' ');
        request({
            uri: "http://google.com/complete/search?client=chrome&q="+query,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                var suggestions = res[1];
                callback(opt.to, suggestions[0] || "No suggestions");
            }
        });
    }
}
