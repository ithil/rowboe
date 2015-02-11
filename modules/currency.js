module.exports = exports = function (app) {
    var request = app.utils.request;
    app.cmdRegister('currency', { "f": currency,
        "h": "Converts currencies. NOTE: You'll have to use the official currency codes (e.g. USD for US Dollar; EUR for Euro; GBP for Pound Sterling). See https://en.wikipedia.org/wiki/ISO_4217#Active_codes for a list of codes.\nSyntax: !currency value in_cur_code out_cur_code\nExample: !currency 100 usd eur",
    });
    var shorthands = {
        "dollar": "USD",
        "dollars": "USD",
        "buck": "USD",
        "bucks": "USD",
        "US$": "USD",
        "$": "USD",
        "A$": "AUD",
        "C$": "CAD",
        "NZ$": "NZD",
        "peso": "MXN",
        "real": "BRL",
        "R$": "BRL",
        "₪": "ILS",
        "euro": "EUR",
        "euros": "EUR",
        "€": "EUR",
        "pound": "GBP",
        "quid": "GBP",
        "£": "GBP",
        "yen": "JPY",
        "¥": "JPY",
        "zł": "PLN",
    }
    function resolveShorthand(name) {
        if(name == undefined) {return undefined;}
        return shorthands[name] || name;
    }
    function currency(opt, callback) {
        var args = opt.cmd.join(' ');
        var numPat = /([0-9\.]+)/;
        var curPat = /([^0-9\.\s]+)[0-9\.]*(\s+([^0-9\.\s]+))?/;
        if(!numPat.test(args) || !curPat.test(args)) {return;}
        var numMatch = args.match(numPat);
        var curMatch = args.match(curPat);
        var value = numMatch[1];
        var inCur = resolveShorthand(curMatch[1]);
        var outCur = resolveShorthand(curMatch[3]) || (inCur=="USD"?"EUR":"USD");
        request({
            uri: "http://rate-exchange.appspot.com/currency?from="+inCur+"&to="+outCur+"&q="+value,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                if (res.v) { 
                  callback(opt.to, value+" "+res.from.toUpperCase()+" = "+res.v+" "+res.to.toUpperCase());
                }
            }
        });
    }
    return module.id;
}
