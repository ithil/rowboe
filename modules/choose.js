// Choose module v0.1
var choose = function (opt, callback) {
    var options = opt.cmd.join(' ').split('/');
    var randNum = Math.floor(Math.random() * (options.length)) + 1;
    callback(opt.to, options[randNum-1]);
}
var coinflip = function (opt, callback) {
    callback(opt.to, (Math.floor(Math.random() * 2) == 0) ? 'Heads.' : 'Tails.');
}

module.exports = exports = function (mainApp) {
    mainApp.cmdRegister('choose', { "f": choose,
        "h": "Lets RowBoe choose between several options separated by slashes.\nExample: !choose read/work out/procrastinate"
    });
    mainApp.cmdRegister('coinflip', { "f": coinflip,
        "h": "Heads or tails? This command will tell you."
    });
    return module.id;
}
