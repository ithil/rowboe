#!/usr/bin/env node

require('mkdirp').sync('db');
var conf = require('nconf');
conf.use('file', { file: 'db/settings.json' });
conf.load();

var readline = require('readline');
var l = console.log;

l('    ____                ____');
l('   / __ \\____ _      __/ __ )____  ___ ');
l('  / /_/ / __ \\ | /| / / __  / __ \\/ _ \\');
l(' / _, _/ /_/ / |/ |/ / /_/ / /_/ /  __/');
l('/_/ |_|\\____/|__/|__/_____/\\____/\\___/ ');


var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var questions = [
    ["Nick: ", function (ans) {
        conf.set('nick', ans);
    }],
    ["Password: ", function (ans) {
        conf.set('password', ans);
    }],
    ["Owner (nick): ", function (ans) {
        conf.set('owner', ans);
        conf.set('admins', [ans]);
    }],
    ["Server: ", function (ans) {
        conf.set('server', ans);
    }],
    ["Channels (that are to be auto-joined): ", function (ans) {
        var channels = ans.split(' ');
        conf.set('channels', channels);
    }],
    ["Save? ", function (ans) {
        conf.set('setupComplete', true);
        conf.save();
        rl.close();
    }]
]

var asyncLoop = function (arr, index) {
    var item = arr[index];
    if(item) {
        rl.question(item[0], function (ans) {
            item[1](ans);
            asyncLoop(arr, index+1);
        })
    }
}

asyncLoop(questions, 0);
