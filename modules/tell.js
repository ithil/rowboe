module.exports = exports = function (app) {
    var client = app.client;
    var db = app.database('main').collection('passon');
    var conf = app.conf;
    var log = app.utils.log;
    var formatPeriod = app.utils.formatPeriod;
    var cnames = app.cnames;
    var handler = function (opt, callback) {
        if(opt.subcmd && subcommands[opt.subcmd]) {
            subcommands[opt.subcmd](opt, callback);
        }
        else if(!opt.subcmd) {
            tell(opt, callback);
        }
    }
    var subcommands = {

    }
    function tell(opt, callback) {
        if (!opt.cmd[0]) {callback(opt.to, this.h);return;}
        var recipient = opt.cmd.shift();
        if (recipient==client.nick) {callback(opt.to, opt.from+": I'm not *that* stupid..");return;}
        if (recipient==opt.from) {callback(opt.to, opt.from+": Tell you yourself!");return;}
        if(cnames[opt.to]) {
            if(Object.keys(cnames[opt.to]).indexOf(recipient) > -1) {
               callback(opt.to, opt.from+": You can tell them yourself, "+recipient+" is online!");
               return;
            }
        }
        if (!opt.cmd[0]) {callback(opt.to, this.h);return;}
        var message = opt.cmd.join(' ');
        var pm = false;
        if(opt.to==client.nick) {pm=true;}
        db.insert({text: opt.cmd.join(' '), from: opt.from, recipient: recipient, channel: opt.to, pm: pm, time: new Date()});
        callback(opt.to, opt.from+": I'll pass that on next time I see "+recipient);
    }
    app.cmdRegister('tell', { "f": handler,
        "h": "Passes on messages to a specified nick.\nSyntax: !tell nick message", 
    });
    // Passing on messages
    function passingOn(channel,nick) {
        db.find({recipient: nick}).toArray(function(err, docs) {
            if(docs) {
                docs.forEach(function(d) {
                   var to = channel;
                   var mute = conf.get('chanprefs:'+to+':mute');
                   if(d.pm || mute) {to=nick;}
                   var tdif = new Date().getTime() - d.time.getTime();
                   client.say(to, nick+": "+formatPeriod(tdif)+" ago msg from <"+d.from+"> "+d.text);
                   db.remove({ _id: d._id });
                });
            }
        });
    }
    client.addListener('join', function(channel,nick,message) {
        passingOn(channel, nick);
    });
    client.addListener('nick', function (nick, newnick, channels, message) {
        passingOn(channels[0], newnick);
    });
}
