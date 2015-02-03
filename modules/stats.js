module.exports = exports = function (app) {
    var client = app.client;
    var db = app.database('main').collection('stats');
    var handler = function (opt, callback) {
        if(opt.subcmd && subcommands[opt.subcmd]) {
            subcommands[opt.subcmd](opt, callback);
        }
        else if(!opt.subcmd) {
            retrieveStats(opt, callback);
        }
    }
    var subcommands = {
        "user": userStats,
    }
    app.cmdRegister('stats', { "f": handler,
        "h": "Shows who talks most in this channel",
    });
    function retrieveStats(opt, callback) {
        var lim = opt.cmd.shift() || 5;
        db.find({channel: opt.to}).sort({lines: -1}).limit(lim).toArray(function (err, docs) {
            if (docs && docs.length > 0) {
                for(var i=0; i<(docs.length);i++) {
                    var doc = docs[i];
                    callback(opt.to, (i+1)+". "+doc.nick+" - "+doc.words+" words over "+doc.lines+" lines (average of "+(doc.words/doc.lines).toFixed(2)+" words per line)");
                }
            }
        })
    }
    function userStats(opt, callback) {
        var user = opt.cmd.shift() || opt.from;
        db.findOne({channel: opt.to, nick: user}, function (err, doc) {
            if (doc) {
                callback(opt.to, doc.nick+" - "+doc.words+" words over "+doc.lines+" lines (average of "+(doc.words/doc.lines).toFixed(2)+" words per line)");
            }
        })
    }

    function updateStats(from, to, message) {
        var thisWpl = message.split(" ").length;
        db.findOne({nick: from, channel: to}, function(err, doc) {
            if(doc) {
                db.update({nick: from, channel: to}, {
                    $inc: { lines: 1, words: thisWpl }, 
                    // $set: { wpl: doc.wpl+(thisWpl-doc.wpl)/(doc.lines+1)} 
                }, {upsert: true});
            }
            else {
                db.insert({nick: from, channel: to, lines: 1, words: thisWpl});
            }
        })
    }
    client.addListener('message', function (from, to, message) {
        updateStats(from, to, message);
    });
}
