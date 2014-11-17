// RowBoe core commands
module.exports = exports = function (app) {
    var mute = function (opt, callback) {
        app.conf.set('chanprefs:'+opt.to+':mute', true);
        app.conf.save();
    }
    app.cmdRegister('mute', { "f": mute,
        "p":"ao",
        "h": "Mutes RowBoe in the current channel. Commands will still be executed, though without a return message. Use !unmute to undo.",
    });

    var unmute = function (opt, callback) {
        app.conf.set('chanprefs:'+opt.to+':mute', false);
        app.conf.save();
    }
    app.cmdRegister('unmute', { "f": unmute,
        "p":"ao",
        "h": "Undoes !mute. See !help mute for details.",
    });

    var echo = function (opt, callback) {
        var text = opt.cmd.join(' ');
        callback(opt.to, text);
    }
    app.cmdRegister('echo', { "f": echo,
        "h": "Echoes the text given as arguments. Becomes useful in combination with an alias.\nSyntax: !echo text",
    });

    var me = function (opt, callback) {
        if(opt.mute){return;}
        var text = opt.cmd.join(' ');
        app.client.action(opt.to, text);
    }
    app.cmdRegister('me', { "f": me,
        "h": "Makes RowBoe send an action message. Useful in combination with an alias.\nExample: !me does something. -> RowBoe does something.",
    });

    var give = function (opt, callback) {
        var nick = opt.cmd.shift();
        if(!nick || !opt.cmd[0]) {callback(opt.to, "Syntax: !give nick cmd");return;}
        app.cmdexec({from: opt.from, to: opt.to, cmd: opt.cmd}, function(t,m) {
            callback(t, nick+': '+m);
        });
    }
    app.cmdRegister('give', { "f": give,
        "h": "Addresses the output of a command to a given nick.\nSyntax: !give nick cmd",
    });
    var help = function (opt, callback) {
        commands = app.commands;
        if(opt.cmd[0]) {
            var cmd = opt.cmd.shift();
            if(commands[cmd]) {
                if(commands[cmd].h) {
                    callback(opt.to, "\x02"+cmd+"\x0F: "+commands[cmd].h);
                    return;
                }
                else {callback(opt.to, "No manual entry for "+cmd)}
                return;
            }
        }
        var cmds = Object.keys(commands);
        var ncmds = [];
        var checkPrivilege = app.utils.checkPrivilege;
        for(var i=0; i < cmds.length; i++) {
            var priv = commands[cmds[i]].p;
            if(priv) {
                if(checkPrivilege(opt.from, opt.to, priv, app)) {
                    ncmds.push(cmds[i]);
                }
            }
            else { ncmds.push(cmds[i]);}
        }
        callback(opt.to, "\x02Cmds:\x0F "+ncmds.join(', '));
    }
    app.cmdRegister('help', { "f": help,
        "h": "Have you tried turning it off and on again?",
    });
    return module.id;
}
