module.exports = exports = function (app) {
    var request = app.utils.request;
    var cheerio = app.utils.cheerio;
    var log = app.utils.log;
    var b = app.bold;
    function youtubeSearch(opt, callback) {
        request({
            uri: "http://gdata.youtube.com/feeds/api/videos/?v=2&alt=jsonc&max-results=1&paid-content=false&q="+opt.cmd.join('+'),
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                if (res.data.totalItems > 0) { 
                  var vid = res.data.items[0];
                  var hours = (vid.duration/3600) | 0;
                  var mins = (vid.duration/60-(hours*60)) | 0;
                  var secs = (vid.duration-(mins*60+hours*3600)) | 0;
                  callback(opt.to, "http://youtu.be/"+vid.id
                      +" ["+(hours>0?hours+":"+("0"+mins).slice(-2):mins)
                      +":"+("0"+secs).slice(-2)+"] "+b(vid.title));
                }
            }
        });
    }
    app.cmdRegister('youtube', { "f": youtubeSearch,
        "h": "Searches YouTube and returns the first result.",
    });
    var ytpat = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
    function youtubePreview(link, opt, callback) {
        var match = link.match(ytpat);
        var video_id = match[1];
        request({
            uri: "http://gdata.youtube.com/feeds/api/videos/"+video_id,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
                var title = $('title').text();
                var duration = $('yt\\:duration').attr('seconds');
                var hours = (duration/3600) | 0;
                var mins = (duration/60-(hours*60)) | 0;
                var secs = (duration-(mins*60+hours*3600)) | 0;
                callback(opt.to, "[YouTube] ["+(hours>0?hours+":"+("0"+mins).slice(-2):mins)
                      +":"+("0"+secs).slice(-2)+"] "+title)
                opt.col.insert({link: link, title: (title?title:undefined), from: opt.from, time: new Date()});
                opt.col.save();
            }
            else { opt.genericPreview(link, opt, callback); };
        });
    }
    app.plugins('link-preview', {
        re: new RegExp(ytpat),
        f: youtubePreview
    })
}
