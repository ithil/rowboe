module.exports = exports = function (app) {
    var request = app.utils.request;
    var cheerio = app.utils.cheerio;
    var useragent = app.utils.useragent;
    app.cmdRegister('imdb', { "f": imdb,
        "h": "Gets metadata on movies from IMDB.",
    });
    function imdb(opt, callback) {
        request({
            uri: "http://www.imdbapi.com/?t="+opt.cmd.join('+'),
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                if(res.Response != "True") {return;}
                callback(opt.to,'[IMDb] '+res.Title+
                                ' ('+res.Year+') | Rating: '+res.imdbRating+
                                ' | '+res.Runtime+' | Director: '+res.Director+
                                ' | Genre: '+res.Genre+' | http://imdb.com/title/'+res.imdbID);
            }
        });
    }
    app.cmdRegister('ans', { "f": answer,
        "h": "Performs basic math and unit conversion via DuckDuckGo.",
    });
    function answer(opt, callback) {
        request({
            uri: "http://api.duckduckgo.com/?format=json&q="+opt.cmd.join('+'),
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                if(res.Answer.length < 1) {return;}
                var $ = cheerio.load(res.Answer);
                callback(opt.to, $('div').text());
            }
        });
    }
    app.cmdRegister('o', { "f": webService,
        "h": "Calls a webservice.",
    });
    function webService(opt, callback) {
        var service = opt.cmd.shift();
        var query = opt.cmd.join('+');
        request({
            uri: "http://tumbolia.appspot.com/"+service+"/"+query,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(opt.to, body);
            }
        });
    }
    app.cmdRegister('np', { "f": lastfm,
        "h": "Gets last track scrobbled to last.fm",
    });
    function lastfm(opt, callback) {
        var query = opt.cmd.join('+');
        request({
            uri: "http://tumbolia.appspot.com/lastfm/"+(query?query:opt.from),
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(opt.to, body);
            }
        });
    }
    app.cmdRegister('wa', { "f": wolfram,
        "h": "Wolfram Alpha. (Slow!)",
    });
    function wolfram(opt, callback) {
        var query = opt.cmd.join('+');
        request({
            uri: "http://tumbolia.appspot.com/wa/"+query,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load('<div>'+body+'</div>');
                var text = $('div').text();
                var lines = text.split(';');
                callback(opt.to, lines[0]+" = "+lines[1]);
            }
        });
    }
    return module.id;
}
