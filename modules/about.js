var pjson = require('../package.json');
module.exports = exports = function (app) {
    var b = app.bold;
    var formatPeriod = app.utils.formatPeriod;
    var handler = function (opt, callback) {
        if(opt.subcmd && commands[opt.subcmd]) {
            commands[opt.subcmd](opt, callback);
        }
        else {
            callback(opt.to, "RowBoe v"+pjson.version);
        }
    }
    var commands = {
        "version": function (opt, callback) {
            callback(opt.to, "Version: "+pjson.version);
        },
        "owner": function (opt, callback) {
            callback(opt.to, "Owner: "+app.conf.get('owner'));
        },
        "author": function (opt, callback) {
            callback(opt.to, "Author: "+pjson.author);
        },
        "license": function (opt, callback) {
            callback(opt.to, "License: "+pjson.license);
        },
        "uptime": function (opt, callback) {
            callback(opt.to, b("Uptime: ")+formatPeriod(process.uptime()*1000));
        },
        "source": function (opt, callback) {
            callback(opt.to, b("\x02Source:\x0F ")+pjson.homepage);
        },
    }
    app.cmdRegister('about', { "f": handler,
        "h": "Shows sundry things about RowBoe (version, etc.)"
    });
    return module.id;
}
