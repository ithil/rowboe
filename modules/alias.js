module.exports = exports = function (app) {
    var db = app.database('main').collection('alias');
    var handler = function (opt, callback) {
        if(opt.subcmd && subcommands[opt.subcmd]) {
            subcommands[opt.subcmd](opt, callback);
        }
        else if(!opt.subcmd) {
            createAlias(opt, callback);
        }
    }
    var subcommands = {
        "info": aliasInfo,
        "rm": removeAlias,
        "del": removeAlias,
        "list": listAliases,
    }
    function createAlias(opt, callback) {
        var alias = opt.cmd.shift();
        db.update({alias: alias}, {$set:{cmd: opt.cmd.join(' '), from: opt.from, time: new Date()}}, {upsert:true});
        db.save();
    }
    app.cmdRegister('alias', { "f": handler,
        "h": "Creates an alias.\nSyntax: !alias name_of_alias command arg1 arg2\nExample: !alias thank echo Thank you, $v1!\n!thank Amy => Thank you, Amy!\nArguments: $v1, $v2, ..., $vn\nAll arguments: $v*\nSpecial variables: $from (sender), $to (channel)"
    });
    function removeAlias(opt, callback) {
        var alias = opt.cmd.shift();
        db.remove({alias: alias});
        db.save();
    }

    app.cmdRegister('unalias', { "f": removeAlias,
        "h": "Removes an alias.\nSyntax: !unalias name_of_alias"
    });
    function listAliases(opt, callback) {
        db.find({ alias: { $exists: true} }).toArray(function (err, docs) {
            var aliases = Array.prototype.map.call(docs, function (d) { return d.alias; })
            callback(opt.to, "\x02Aliases:\x0F "+aliases.join(', '));
        })
    }
    app.cmdRegister('aliases', { "f": listAliases,
        "h": "Lists all aliases. Use !alias:info to retrieve details.",
    });

    function aliasInfo(opt, callback) {
        var alias = opt.cmd.shift();
        db.findOne({alias: alias}, function(err, doc) {
            if(doc) {
                var AlCmd = doc.cmd;
                var author = doc.from;
                var time = doc.time;
                callback(opt.to, "\x02Alias info:\x0F "+alias
                    +"\n\x02Command:\x0F "+AlCmd
                    +"\n\x02Author:\x0F "+author
                    +"\n\x02Created:\x0F "+time.toString());
            }
            else {
                callback(opt.to, alias+": No such alias");
            }
        })
    }
}
