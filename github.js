// 抓取github star人的邮箱

var http = require("http"),
    url = require("url"),
    superagent = require('superagent-charset'),
    cheerio = require("cheerio"),
    async = require("async"),
    eventproxy = require('eventproxy'),
    request = require("request"),
    fs = require('fs'),
	ep = new eventproxy();

var pageUrls = [];
for (var i = 1; i <= 13; i++) {
    pageUrls.push('https://github.com/ciqulover/CMS-of-Blog/stargazers?page=' + i);
}


function onRequest(req, res) {
    pageUrls.forEach(function(pageUrl) {
        superagent.get(pageUrl)
            .charset('gbk')
            .end(function(err, pres) {
                // 常规的错误处理
                if (err) {
                    console.log(err);
                }
                var $ = cheerio.load(pres.text);
                var linkArr = [];
                $('.follow-list-item').each(function(index, el) {
                    linkArr.push($(this).find('.follow-list-name a').attr('href'));
                });
                ep.emit('movieUrl', linkArr);
            });
    });
    ep.after('movieUrl', pageUrls.length, function(linkArrs) {
        var movieLinks = [];
        linkArrs.forEach(function(val, index) {
            movieLinks = movieLinks.concat(val);
        });
        var reptileLink = function(url,callback){
            console.log( '正在抓取页面：' + 'https://github.com' + url);
            superagent
                .get('https://github.com' + url)
                .set('Cookie', 'user_session=9YEZcOGGhF1Fz8QQcn4kEBYDeuQXFyIP67g8ExLo0QZSPAeY;')
                .end(function(err, pres) {
                    // 常规的错误处理
                    if (err) {
                        console.log(err);
                    }
                    var $ = cheerio.load(pres.text);
                    setTimeout(function() {
                        callback(null, $('.u-email').text()||'');
                    }, 3000);
                });
        }
        async.mapLimit(movieLinks, 10 ,function (url, callback) {
          reptileLink(url, callback);
        }, function (err,result) {
            var out = [];
            for(var i=0, len = result.length; i<len; i++){
                if(result[i]){
                    out.push(result[i]);
                }
            }
            fs.writeFile('emails.json', JSON.stringify(out), (err) => {
                if (err) throw err;
            });
        })
    })
}
onRequest();

