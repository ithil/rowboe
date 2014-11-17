// Utilities
var cheerio = require('cheerio');
var request = require('request');
var useragent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.103 Safari/537.36';
var moment = require('moment-timezone');

function log(text) {
    var d = new Date();
    console.log(d.toLocaleTimeString()+' '+text);
}

function checkPrivilege(nick, channel, privilege, app) {
    var cnames = app.cnames;
    var admins = app.conf.get('admins') || [];
    if (admins.indexOf(nick) != -1) {
        if(privilege.indexOf('a') > -1) {return true;}
    }
    if(nick == channel) {return false;}
    if (cnames[channel] && cnames[channel][nick] == '@') {
        if(privilege.indexOf('o') > -1) {return true;}
    }
    if (cnames[channel] && cnames[channel][nick] == '+') {
        if(privilege.indexOf('v') > -1) {return true;}
    }
    return false;
};

// http://stackoverflow.com/a/14919494
function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(bytes < thresh) return bytes + ' B';
    var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(bytes >= thresh);
    return bytes.toFixed(1)+' '+units[u];
};

function formatPeriod(period) {
    var days = Math.floor(period/1000/60/60/24);
    period -= days*1000*60*60*24;
    var hours = Math.floor(period/1000/60/60);
    period -= hours*1000*60*60;
    var minutes = Math.floor(period/1000/60);
    period -= minutes*1000*60;
    var seconds = Math.floor(period/1000);
    return ((days>0?(days+" days "):'')
        +(hours>0?(hours+" hours "):'')
        +(minutes>0?(minutes+" minutes"):'')+(minutes<1?(seconds+" seconds"):''));
}

function formatMessage(from, to, text, args) {
    text = text.replace(/\$from/g, from);
    text = text.replace(/\$to/g, to);
    text = text.replace(/\$v([0-9]+)/g, function(a, b){
        return (args[parseInt(b)-1] || '');
    })
    text = text.replace(/\$v\*/g, args.join(' '));
    return text;
}

module.exports = {
    log: log,
    checkPrivilege: checkPrivilege,
    humanFileSize: humanFileSize,
    formatPeriod: formatPeriod,
    formatMessage: formatMessage,
    cheerio: cheerio,
    request: request,
    useragent: useragent,
    moment: moment,
}
