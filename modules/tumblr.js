module.exports = exports = function (app) {
    var request = app.utils.request;
    var log = app.utils.log;
    var formatPeriod = app.utils.formatPeriod;
    var f = app.format;

    var api_key = "fuiKNFp9vQFvjLNvx4sUwti4Yb5yGutBN4Xh10LXZhhRKjWlV4";
    var tumpat = new RegExp('([^\\./]+\\.tumblr\\.com)');
    function tumblrPreview(link, opt, callback) {
        var url;
        var type = "none";
        var postpat = new RegExp('([^\\./]+\\.tumblr\\.com)/post/([0-9]+)');
        var blogpat = new RegExp('([^\\./]+\\.tumblr\\.com)/?');
        if (postpat.test(link)) { 
            var match = link.match(postpat);
            url = "http://api.tumblr.com/v2/blog/"+match[1]+"/posts?id="+match[2]+"&";
            type = "post";
        }
        else if (blogpat.test(link)) { url = "http://api.tumblr.com/v2/blog/"+link.match(blogpat)[1]+"/info?"; type = "blog";}
        request({
            uri: url+"api_key="+api_key,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                var title;
                if(type == "post") {
                    var data = res.response.posts[0];
                    var notes = data.note_count;
                    var post_type = data.type;
                    post_type = post_type[0].toUpperCase()+post_type.slice(1);
                    var source = data.source_title;
                    var timestamp = new Date().getTime() - data.timestamp*1000;
                    callback(opt.to, "[Tumblr] ♥"+notes+" | "
                        +post_type
                        +(source?(" | Source: "+source):"")
                        +" | "+formatPeriod(timestamp)+" ago");
                }
                else if(type == "blog") {
                    var data = res.response.blog;
                    title = data.title;
                    var posts = data.posts;
                    var likes = data.likes;
                    var nsfw = data.is_nsfw;
                    var updated = new Date().getTime() - data.updated*1000;
                    callback(opt.to, "[Tumblr] "+title
                            +" | "+(nsfw?f("light_red","NSFW "):"")
                            +posts+" posts "+(likes?("/ "+likes+" likes "):"")
                            +"| Last updated: "+formatPeriod(updated)+" ago");
                }
                opt.col.insert({link: link, title: (title?title:undefined), from: opt.from, time: new Date()});
                opt.col.save();
            }
            else { opt.genericPreview(link, opt, callback); };
        });
    }
    app.plugins('link-preview', {
        re: new RegExp(tumpat),
        f: tumblrPreview
    })
}
