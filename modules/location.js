module.exports = exports = function (app) {
    var client = app.client;
    var request = app.utils.request;
    var cheerio = app.utils.cheerio;
    var useragent = app.utils.useragent;
    var db = app.database('main').collection('userData');
    var dns = require('dns');
    var moment = app.utils.moment;
    var log = app.utils.log;
    app.cmdRegister('setlocation', { "f": setLocation,
        "h": "Sets your preferred location for !time and !weather",
    });
    function setLocation(opt, callback) {
        var query = opt.cmd.join('+');
        var nick = opt.from;
        geocode(query, function (geo) {
            getTimeZone(geo.lat, geo.lng, function (timeZoneId) {
                getWoeid(query, function (woeid) {
                    db.update({nick: nick}, {$set: { geo: geo, tz: timeZoneId, woeid: woeid } }, {upsert: true})
                    db.save();
                    callback(opt.to, geo.address+" (time zone: "+timeZoneId+")");
                });
            });
        });
    }
    function getLocation(nick, callback) {
        db.findOne({nick: nick}, function (err, doc) {
            if (doc) {
                callback(doc);
            }
        });
    }
    app.cmdRegister('geoip', { "f": geoipCmd,
        "h": "Retrieves country and timezone of a given user. This won't work if the user has their IP address hidden.",
    });
    function geoipCmd(opt, callback) {
        var nick = opt.cmd.shift();
        client.whois(nick, function (info) {
            if(info.host) {
                var host = info.host;
                geoip(host, function (res) {
                    var time = (res.timezone?moment().tz(res.timezone).format('h:mm a'):undefined);
                    callback(opt.to, "\x02"+nick+":\x0F Country: "+res.country+(res.timezone?" Timezone: "+res.timezone+" (\x02"+time+"\x0F)":''));
                });
            }
        })
    }
    function geoip(address, callback) {
        dns.lookup(address, function(err, address) {
            if(err) {
                var clpat = new RegExp('ip\.((?:[0-9]{1,3}\.){3}[0-9]{1,3})');
                if(address.match(clpat)) {address = address.match(clpat)[1]};
            }
            request({
                uri: "http://www.telize.com/geoip/"+address,
            }, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var res = JSON.parse(body);
                    if (res.country) { 
                        callback(res);
                    }
                }
            });
        })
    }
    app.cmdRegister('time', { "f": timeCmd,
        "h": "Returns the current time in a given location.",
    });
    function timeCmd(opt, callback) {
        var output = function (timeZoneId, geo) {
            var time = moment().tz(timeZoneId).format('h:mm a');
            callback(opt.to, '\x02'+geo.address+':\x0F '+time);
        }
        if(!opt.cmd[0]) {
            //callback(opt.to, "The time is... inexorably slipping away.");return;
            getLocation(opt.from, function (doc) {
                output(doc.tz, doc.geo);
            });
        }
        else {
        var query = opt.cmd.join('+');
            geocode(query, function (geo) {
                getTimeZone(geo.lat, geo.lng, function (timeZoneId) {
                    output(timeZoneId, geo);
                });
            });
        }
    }
    function geocode(query, callback) {
        request({
            uri: "http://maps.googleapis.com/maps/api/geocode/json?address="+query,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                if (res.results.length > 0) { 
                    var geo = { };
                    geo.lat = res.results[0].geometry.location.lat;
                    geo.lng = res.results[0].geometry.location.lng;
                    geo.address = res.results[0].formatted_address;
                    callback(geo);
                }
            }
        });
    }
    function getTimeZone(lat, lng, callback) {
        request({
            uri: "https://maps.googleapis.com/maps/api/timezone/json?timestamp=0&location="+lat+","+lng,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                if (res.timeZoneId) { 
                    callback(res.timeZoneId);
                }
            }
        });
    }
    app.cmdRegister('weather', { "f": weather,
        "h": "Returns the current weather in a given location.",
    });
    function weather(opt, callback) {
        var query = opt.cmd.join('+');
        var output = function (woeid) {
            request({
                uri: "http://weather.yahooapis.com/forecastrss?u=c&w="+woeid,
            }, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(body);
                    if(!$('link')) {log('City not found'); return;}
                    var title = $('title').first().text().slice(17);
                    var conds = $('yweather\\:condition');
                    var atmos = $('yweather\\:atmosphere');
                    var astro = $('yweather\\:astronomy');
                    var wind = $('yweather\\:wind');
                    var text = conds.attr('text');
                    var tempc = conds.attr('temp');
                    var tempf = Math.round((tempc*1.8)+32);
                    var humidity = atmos.attr('humidity');
                    var pressure = atmos.attr('pressure');
                    var prein = Math.round(pressure/33.7685);
                    var kph = wind.attr('speed');
                    var m_s = Math.round(kph/3.6);
                    var speed = Math.round(kph/1.852);
                    var degrees = Math.round(wind.attr('direction'));

                    var windDescriptions = [
                        [1, "Calm"],
                        [4, "Light air"],
                        [7, "Light breeze"],
                        [11, "Gentle breeze"],
                        [16, "Moderate breeze"],
                        [22, "Fresh breeze"],
                        [28, "Strong breeze"],
                        [34, "Near gale"],
                        [41, "Gale"],
                        [48, "Strong gale"],
                        [56, "Storm"],
                        [64, "Violent storm"],
                    ]
                    var wind_des = "";
                    windDescriptions.some(function (i) {
                        if(speed < i[0]) {wind_des = i[1];return true;}
                    })
                    wind_des = (wind_des.length==0?"Hurricane":wind_des);

                    var sunrise = astro.attr('sunrise');
                    var sunset = astro.attr('sunset');
                    callback(opt.to, '\x02'+title+':\x0F '+
                                      text+', '+
                                      tempc+'°C ('+tempf+'°F), '+
                                      'Hum.: '+humidity+'%, Pressure: '+prein+'in ('+pressure+'mb), '+
                                      wind_des+' '+m_s+'m/s, '+
                                      sunrise+'-'+sunset
                                      );
                }
            })
        }
        if(!opt.cmd[0]) {
            getLocation(opt.from, function (doc) {
                output(doc.woeid);
            });
        }
        else {
            getWoeid(query, output);
        }
    }
    function getWoeid(query, callback) {
        var q = 'q=select * from geo.placefinder where text="'+query+'"';
        request({
            uri: "http://query.yahooapis.com/v1/public/yql?"+q,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
                if($('Result').length == 0) {return;}
                var woeid = $('woeid').first().text();
                callback(woeid);
            }
        });
    }
    return module.id;
}
