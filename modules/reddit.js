module.exports = exports = function (app) {
    var request = app.utils.request;
    var log = app.utils.log;
    var formatPeriod = app.utils.formatPeriod;
    function redditSearch(opt, callback) {
        var sortpat = new RegExp("sort:([A-Za-z]+)")
        var sort = 'relevance';
        if (sortpat.test(opt.cmd.join(' '))) {
            opt.cmd.join(' ').replace(sortpat, function (a, b) {
                opt.cmd.splice(opt.cmd.indexOf(a), 1);
                sort = b;
                return '';
            })
        }
        request({
            uri: "http://www.reddit.com/search.json?limit=1&sort="+sort+"&q="+encodeURI(opt.cmd.join('+')),
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                if (!res.data) {return;}
                if (res.data.children.length > 0) { 
                  var item = res.data.children[0].data;
                  callback(opt.to, "http://redd.it/"+item.id+" /r/"+item.subreddit+" \x02"+item.title);
                }
            }
        });
    }
    app.cmdRegister('reddit', { "f": redditSearch,
        "h": "Searches reddit and returns the first result.",
    });
    function redditPreview(link, opt, callback) {
        var url;
        var type = "none";
        var subredditpat = new RegExp("reddit.com/r/([A-Za-z0-9]+)/?$");
        if (subredditpat.test(link)) { url = "http://www.reddit.com/r/"+link.match(subredditpat)[1]+"/about.json"; type = "subreddit";}
        var commentspat = new RegExp("reddit.com/r/([A-Za-z0-9]+)/comments/([^/]+)/?.*");
        if (commentspat.test(link)) { url = link+(link.slice(-1)=="/"?"":"/")+"about.json"; type = "comments";}
        var userpat = new RegExp("reddit.com/u(ser)?/([A-Za-z0-9]+)/?$");
        if (userpat.test(link)) { url = link+(link.slice(-1)=="/"?"":"/")+"about.json"; type = "user";}
        request({
          uri: url,
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                var title;
                if(type == "subreddit") {
                    var data = res.data;
                    title = data.title;
                    var nsfw = data.over18;
                    var des = data.public_description;
                    var subscribers = data.subscribers;
                    var created = new Date().getTime() - data.created*1000;
                    callback(opt.to, "[Subreddit] "+title+" | "+(nsfw?"\x04NSFW\x0F ":"")+subscribers+" subscribers | "+des+" | subreddit for "+formatPeriod(created));
                }
                else if(type == "comments") {
                    var data = res[0].data.children[0].data;
                    title = data.title;
                    var nsfw = data.over_18;
                    var author = data.author;
                    var created = new Date().getTime() - data.created*1000;
                    callback(opt.to, "[reddit] "+title+" | "
                        +(nsfw?"\x04NSFW\x0F ":"")
                        +"/u/"+author+" | ↑"
                        +data.ups+" ("+data.upvote_ratio*100+"%)"
                        +" | submitted "+formatPeriod(created)+" ago");
                }
                else if(type == "user") {
                    var data = res.data;
                    var name = data.name;
                    var created = new Date().getTime() - data.created*1000;
                    title = name;
                    callback(opt.to, "[reddit] /u/"+name+" ("+data.link_karma+"|"+data.comment_karma+") redditor for "+formatPeriod(created));
                }
                opt.col.insert({link: link, title: (title?title:undefined), from: opt.from, time: new Date()});
                opt.col.save();
            }
            else { opt.genericPreview(link, opt, callback); };
        });
    }
    app.plugins('link-preview', {
        re: new RegExp("reddit.com"),
        f: redditPreview
    })
}
