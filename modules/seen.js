module.exports = exports = function (app) {
    var client = app.client;
    var db = app.database('main').collection('seen');
    var conf = app.conf;
    var log = app.utils.log;
    var formatPeriod = app.utils.formatPeriod;
    var cnames = app.cnames;
    function lastSeen(opt, callback) {
        var all = false;
        if(opt.subcmd=='all'){all=true}
        if (!opt.cmd[0]) {callback(opt.to, "Error: not enough arguments");return;}
        var nick = opt.cmd.shift();
        var patt = RegExp(nick,"i");
        var anames = [];
        var cnamesk = Object.keys(cnames);
        for(var i=0; i < cnamesk.length; i++) {
            var lcnames = Object.keys(cnames[cnamesk[i]]);
            anames = anames.concat(lcnames);
        }
        for(var i=0; i < anames.length; i++) {
            if(patt.test(anames[i])) {
                callback(opt.to, anames[i]+" last seen: now");
                if(!all) {return};
            }
        }
        db.find({nick: RegExp(nick, "i")}).sort({time: -1}).toArray(function (err, docs) {
            if (docs.length > 0) {
                for(var i=0; i<(all?docs.length:1);i++) {
                var tdif = new Date().getTime() - docs[i].time.getTime();
                callback(opt.to, docs[i].nick+": "+formatPeriod(tdif)+" ago");
                }
            }
        })
    }
    app.cmdRegister('seen', { "f": lastSeen,
        "h": "Outputs the amount of time since a user was last seen by RowBoe. Use :all to output all users containing a given string.\nExample 1: !seen Amy\nExample 2: !seen:all Bob (outputs Bob, Bob_ Bob1, etc.)",
    });
    // Last seen
    client.addListener('part', function (channel, nick, reason, message) {
        db.update({nick: nick}, {$set: { time: new Date(), reason: reason, channel: channel, message: message } }, {upsert: true})
    });
    
    client.addListener('quit', function (nick, reason, channels, message) {
        db.update({nick: nick}, {$set: { time: new Date(), reason: reason, message: message } }, {upsert: true})
    });
    
    client.addListener('kick', function (channel, nick, by, reason, message) {
        db.update({nick: nick}, {$set: { time: new Date(), reason: reason, message: message } }, {upsert: true})
    });
    
    client.addListener('nick', function (nick, newnick, channels, message) {
        db.update({nick: nick}, {$set: { time: new Date(), message: message } }, {upsert: true})
    });
}
