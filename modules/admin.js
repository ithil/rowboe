// RowBoe admin commands
module.exports = exports = function (app) {
    var join = function (opt, callback) {
        if (!opt.cmd[0]) {
            callback(opt.to, "Error: not enough arguments");
            return;
        }
        app.client.join(opt.cmd[0]);
    }
    app.cmdRegister('join', { "f": join,
        "p":"a", 
        "h": "Makes RowBoe join a channel. Note: this will only persist up until the next restart. If you want RowBoe to permanently join a channel use !set + channels #channel.\nSyntax: !join #channel"
    });

    var part = function (opt, callback) {
        app.client.part(opt.cmd[0] || opt.to);
    }
    app.cmdRegister('part', { "f": part,
        "p":"a",
        "h": "Makes RowBoe leave a channel. If no channel is specified the current channel is being used. Note: this will only persist up until the next restart. If you want to remove a channel from the auto-join list use !set - channels #channel.\nSyntax: !part #channel"
    });

    var quit = function (opt, callback) {
        app.client.disconnect(opt.cmd[0] || "Quitting.", function() {process.exit();});
    }
    app.cmdRegister('quit', { "f": quit,
        "p":"a",
        "h": "Makes RowBoe quit. A quit message is optional.\nSyntax: !quit message",
    });

    var nick = function (opt, callback) {
         if (!opt.cmd[0]) {
            callback(opt.to, "Error: not enough arguments");
            return;
         }
         app.client.send('NICK', opt.cmd[0]);
    }
    app.cmdRegister('nick', { "f": nick,
        "p":"a",
        "h": "Changes RowBoe's nick temporarily. To change it permanently use !set nick newnick\nSyntax: !nick newnick",
    });

    var remote = function (opt, callback) {
        if (!opt.cmd[1]) {
            callback(opt.to, this.h);
            return;
        }
        var channel = opt.cmd.shift();
        app.cmdexec({ from: opt.from, to: channel, cmd: opt.cmd });
    }
    app.cmdRegister('remote', { "f": remote,
        "p":"a",
        "h": "Executes a command remotely.\nSyntax: !remote #channel command",
    });
    return module.id;
}
