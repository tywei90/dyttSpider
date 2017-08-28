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
for (var i = 2; i <= 4; i++) {
    pageUrls.push('http://www.ygdy8.net/html/gndy/jddy/20160320/50510_' + i + '.html');
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
                var $ = cheerio.load(pres.text, { decodeEntities: false });
                var linkArr = [];
                $('#Zoom a').each(function(index, el) {
                    if ($(this).attr('href').indexOf('http://www.ygdy8') > -1) {
                        linkArr.push($(this).attr('href'));
                    }
                });
                ep.emit('movieUrl', linkArr);
            });
    });
    ep.after('movieUrl', pageUrls.length, function(linkArrs) {
        var movieLinks = [];
        linkArrs.forEach(function(val, index) {
            movieLinks = movieLinks.concat(val);
        });
        movieLinks.forEach(function(movieLink) {
            superagent.get(movieLink)
                .charset('gbk')
                .end(function(err, pres) {
                    // 常规的错误处理
                    if (err) {
                        console.log(err);
                    }
                    var $ = cheerio.load(pres.text, { decodeEntities: false });
                    var movie = '';
			        $('a').each(function(){
			        	if($(this).attr('href').indexOf('ftp://') != -1){
			        		movie = $(this).attr('href');
			        		return
			        	}
			        })
                    ep.emit('movie', movie);
                });
        });
        ep.after('movie', movieLinks.length, function(movies) {
        	var realLinks = [];
        	movies.forEach(function(val, index){
        		if(val){
        			realLinks.push(val);
        		}
        	})
            fs.writeFile('top200_movies.txt', realLinks.join('\n'), (err) => {
                if (err) throw err;
                console.log('=============== 所有top200电影资源已爬取完毕！ ===============');
            });
        })
    })
}
onRequest();



