// RowBoe - an irc bot
var app = {};
var irc = require('irc');
var Engine = require('tingodb')();
app.conf = require('nconf');
var utils = require('./utils');
app.utils = utils;

// Load settings
app.conf.use('file', { file: 'db/settings.json' });
app.conf.load();

// Check if setup has been completed
if(!app.conf.get('setupComplete')) {
    console.log("RowBoe hasn't been configured yet");
    console.log("Run 'node ./setup.js' to start configuration setup");
    process.exit(1);
}

// Initialize irc client
app.client = new irc.Client(app.conf.get('server'), app.conf.get('nick'), { channels: app.conf.get('channels'), messageSplit: 440});

// Message formatting
app.format = irc.colors.wrap;
app.bold = function(text) {return irc.colors.wrap("bold", text)}

// Prepare database access
app.databases = { };
app.database = function (db) {
    if(app.databases[db]) {
        return app.databases[db];
    }
    else {
        require('mkdirp')('db/'+db+'/', function(err) {
            if (err) console.error(err)
        });
        app.databases[db] = new Engine.Db('db/'+db+'/', {});
        return app.databases[db];
    }
}

// Plugins for modules
app._plugins = { };
app.plugins = function(name, plugin) {
    var p = app._plugins;
    if(typeof(plugin) != "undefined") {
        if(typeof(p[name]) == "undefined") {p[name] = [ ]}
        p[name].push(plugin);
    }
    else {
        return p[name];
    }
}

// Keep alive
setInterval(function(){app.client.send('PONG', 'empty');}, 5*60*1000);

// Lists of online users for each channel that RowBoe has joined
app.cnames = { };
app.client.addListener('names', function(channel, nicks) {
    app.cnames[channel] = nicks;
})
app.client.addListener('+mode', function(c,b,m,a,me) {app.client.send('NAMES', c)});
app.client.addListener('-mode', function(c,b,m,a,me) {app.client.send('NAMES', c)});
app.client.addListener('join', function(c,n,me) {app.client.send('NAMES', c)});
app.client.addListener('part', function(c,n,r,me) {app.client.send('NAMES', c)});

// Identifying
app.client.addListener('registered', function(message) {
    app.client.say("NickServ", "IDENTIFY "+app.conf.get('nick')+" "+app.conf.get('password'));
    app.client.say("NickServ", "GHOST "+app.conf.get('nick')+" "+app.conf.get('password'));
    setTimeout(function() {app.client.send('NICK', app.conf.get('nick'));}, 10000);
    utils.log('Successfully connected to server.');
});

// Logging
app.client.addListener('join', function(c,n,me) {if(n==app.client.nick) {utils.log('Joined '+c)}});
app.client.addListener('part', function(c,n,r,me) {if(n==app.client.nick) {utils.log('Parted '+c)}});


// Error handler (irc-related errors)
app.client.addListener('error', function(message) {
    utils.log('Node-IRC Error: '+JSON.stringify(message));
});

// Keeps bot from crashing
process.on('uncaughtException', function (exception) {
    utils.log('Uncaught exception: '+exception);
});

// Commands
app.cmdexec = function (opt, callback) {
    if(opt.from == app.client.nick) {return;}
    var callback = callback || function (to, message) {
        app.client.say(to, message);
    }
    var mute = false;
    if(app.conf.get('chanprefs:'+opt.to+':mute')) {callback = function (t, m) {return;};mute=true}
    utils.log(opt.from+' issued a command.');
    var cmdpat = /^([A-Za-z0-9_]+)(:([A-Za-z0-9_]+))?/;
    var cmdarr = cmdpat.exec(opt.cmd[0]);
    opt.cmd[0] = cmdarr[1];
    var subcmd = opt.subcmd || cmdarr[3];
    var cmnd = app.commands[opt.cmd[0]];
    if (cmnd) {
        if(cmnd.p) {
            if(utils.checkPrivilege(opt.from, opt.to, cmnd.p, app)) {
                opt.cmd.shift();
                cmnd.f({from: opt.from, to: opt.to, cmd: opt.cmd, mute: mute, subcmd: subcmd}, callback);
            }
            else { callback(opt.to, opt.cmd[0]+": Permission denied.") }
        }
        else {
            opt.cmd.shift();
            cmnd.f({from: opt.from, to: opt.to, cmd: opt.cmd, mute: mute, subcmd: subcmd}, callback);
        }
    }
    else {
        app.database('main').collection('alias').findOne({alias: opt.cmd[0]}, function(err, doc) {
            if(doc) {
                var AlCmd = doc.cmd.split(' ');
                if(opt.cmd[0] == AlCmd[0]) {
                    callback(opt.to, "Error: Stop your recursion attempts at once!");
                    return;
                }
                opt.cmd.shift();
                var corecmd = AlCmd.shift();
                var text = utils.formatMessage(opt.from, opt.to, AlCmd.join(' '), opt.cmd);
                var AlCmd2 = text.split(' ');
                AlCmd2.unshift(corecmd);
                app.cmdexec({from: opt.from, to: opt.to, cmd: AlCmd2, subcmd: subcmd}, callback);
            }
            else {
                callback(opt.to, opt.cmd[0]+": Unknown command");
            }
        })
    }
}
app.client.addListener('message', function (from, to, message) {
    var cmdpat = new RegExp('^!([A-Za-z0-9_]+.*)');
    if (cmdpat.test(message)) {
        var cmd = cmdpat.exec(message)[1].split(' ');
        app.cmdexec({from: from, to: to, cmd: cmd});
    }
});

app.client.addListener('pm', function(from, message) {
    if(from=="NickServ") {return;}
    var cmdpat2 = new RegExp('^!?([A-Za-z0-9_]+.*)');
    if (cmdpat2.test(message)) {
        var cmd = cmdpat2.exec(message)[1].split(' ');
        app.cmdexec({from: from, to: from, cmd: cmd});
    }
})

app.cmdRegister = function (name, cmd) {
    app.commands[name] = cmd;
}

app.commands = {
    "ping" : { "h": "Returns 'Pong!'; does nothing else.",
               "f": function (opt, callback) {
                callback(opt.to, "Pong!");
              }}
}

// Loading modules
var normalizedPath = require('path').join(__dirname, "modules");
var modules = new Array();
require("fs").readdirSync(normalizedPath).forEach(function(file) {
    if((/\.js$/).test(file)) {
        modules.push(require("./modules/" + file)(app));
    }
});
utils.log('Loaded '+modules.length+' modules');
