module.exports = exports = function (app) {
    var client = app.client;
    var db = app.database('links');
    var cheerio = app.utils.cheerio;
    var request = app.utils.request;
    var useragent = app.utils.useragent;
    var conf = app.conf;
    var log = app.utils.log;
    var handler = function (opt, callback) {
        if(opt.subcmd && subcommands[opt.subcmd]) {
            subcommands[opt.subcmd](opt, callback);
        }
        else if(!opt.subcmd) {
            linksCmd(opt, callback);
        }
    }
    var subcommands = {

    }
    function linksCmd(opt, callback) {
        var col;
        if(RegExp('([#&][^\x07\x2C\s]{0,200})').test(opt.cmd[0])) {
            col = db.collection(opt.cmd.shift());
        }
        else {
            if(opt.to == opt.from) {
                callback(opt.to, "You need to specify a channel: !links #channel query");
                return;
            }
            col = db.collection(opt.to);
        }
        col.find({ $or: [ {title: RegExp(opt.cmd.join(' '), 'i') }, {link: RegExp(opt.cmd.join(' '), 'i')} ]}).sort({time: -1}).limit(1).toArray(function(err, docs) {
            if(docs) {
                docs.forEach(function(d) {
                    callback(opt.to, d.link+' \x02'+(d.title?d.title:''));
                })
            }
        })
    }
    app.cmdRegister('links', { "f": handler,
        "h": "Queries the posted-links database for a given term, returning the newest link. The channel argument is optional unless issued via /msg.\nSyntax: !links #channel query",
    });
    // Link preview
    var linkpat = new RegExp("(https?:\/\/[^ ]+)")
    function linkPreview(from, to, message) {
        if (linkpat.test(message)) {
            var callback = function(t,m) {client.say(t,m);}
            if(conf.get('chanprefs:'+to+':mute')) {callback = function(t,m) { return;  };}
            var link = message.match(linkpat)[0];
            var col = db.collection(to);
            var plugins = app.plugins('link-preview');
            var i = plugins.length;
            while(i--) {
                var p = plugins[i];
                if(p.re.test(link)) {
                    p.f(link, {from: from, to: to, message: message, col: col, genericPreview: genericPreview}, callback);
                    return;
                }
            }
            genericPreview(link, {from: from, to: to, message: message, col: col}, callback);
        }
    }
    function genericPreview(link, opt, callback) {
        var r = request({
          uri: link,
          headers: { 'User-Agent': useragent }
        }, function(error, response, body) {
            var title;
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
         
                title = $('title').text();
                var contType = response.headers['content-type'];
                if (title) {
                  callback(opt.to, "\x02T:\x0F "+title.replace(/(\r\n|\n|\r)/gm," ").trim());
                }
                else { log('['+link+'] -> No title')};
            }
            else { log('['+link+'] -> Error: '+error)};
            opt.col.insert({link: link, title: (title?title:undefined), from: opt.from, time: new Date()});
            opt.col.save();
        });
        r.on('response', function (response) {
            var contType = response.headers['content-type'];
            var size = response.headers['content-length'];
            if(!RegExp('text/html').test(contType)) {
                callback(to, "\x02Type:\x0F "+contType+" \x02Size:\x0F "+app.utils.humanFileSize(size, true));
            }
            if(size > (5 * 1024 * 1024)) {
                r.abort();
                r.emit('error', new Error("Maximum file size (5MiB) reached"));
            }
        }).setMaxListeners(20);
    }
    app.client.addListener('message', linkPreview);
}
