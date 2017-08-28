var http = require("http"),
    url = require("url"),
    superagent = require('superagent-charset'),
    cheerio = require("cheerio"),
    async = require("async"),
    eventproxy = require('eventproxy'),
    request = require("request"),
    fs = require('fs'),
	ep = new eventproxy(),
    colors = require('colors'),
    sortArrMethods = require('./sortArr.js');

// node后台log颜色设置
colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

var pageUrls=[];
for (var i = 1; i <= 96; i++) {
    pageUrls.push('http://www.ygdy8.net/html/gndy/china/list_4_' + i + '.html');
}


function onRequest(req, res) {
    var startTime_all = +Date.now();
    var hasComp1 = 0;
    var len1 = pageUrls.length;
    // 爬取每个分页上的所有电影页面的链接
    var reptileLink = function(url,callback){
        // 如果爬取页面有限制爬取次数，这里可设置延迟
        var delay = 0;
        var startTime = +Date.now();
        console.log( '正在抓取页面：' + url);
        superagent.get(url)
            .charset('gbk')
            .end(function(err,pres){
                  // 常规的错误处理
                if (err) {
                  console.log(err.message.error);
                  return;
                }         
                var $ = cheerio.load(pres.text, { decodeEntities: false });
                var movieLinks = [];
                var $table = $('.co_content8 table');
                $table.each(function(){
                    if($('.ulink', $(this)).length == 1){
                        // 只有电影名称
                        movieLinks.push('http://www.ygdy8.net' + $('.ulink', $(this)).attr('href'));
                    }else{
                        // 有分类和电影名称
                        movieLinks.push('http://www.ygdy8.net' + $('.ulink', $(this)).eq(1).attr('href'));
                    }
                });
                var endTime = +Date.now();
                hasComp1++;
                var hasCompReg1 = (100*hasComp1/len1).toFixed(2) +'%';
                console.log( url + '，页面抓取完毕，' + '耗时' + (endTime - startTime) + '毫秒，第一阶段完成' + hasCompReg1);
                setTimeout(function() {
                    callback(null, movieLinks);
                }, delay);
            });
    };
    console.log('第一阶段：爬取列表页所有电影链接，开始'.debug);
    async.mapLimit(pageUrls, 5 ,function (url, callback) {
      reptileLink(url, callback);
    }, function (err,result) {
        console.log('第一阶段爬取结束'.debug);
        var allMovieLinks = [];
        // result是双重数组，一维数组表示电影列表页，二维数组表示对应列表页的所有电影链接
        for(var i=0, len = result.length; i<len; i++){
            allMovieLinks = allMovieLinks.concat(result[i]);
        }
        var hasComp2 = 0;
        var len2 = allMovieLinks.length;
        // 爬取每个电影页面的迅雷下载链接，筛选了页面能打开的电影
        var reptileDown = function(url,callback){
            var delay = 0;
            var startTime = +Date.now();
            console.log( '正在抓取页面：' + url);
            superagent.get(url)
                .charset('gbk')
                .end(function(err, pres) {
                    // 常规的错误处理
                    if (err) {
                        console.log(err.message.error);
                        return;
                    }
                    var $ = cheerio.load(pres.text, { decodeEntities: false });
                    var movie = [];
                    $('a').each(function(){
                        if($(this).attr('href').indexOf('ftp://') != -1){
                            movie.push($(this).attr('href').trim());
                            return
                        }
                    })
                    var endTime = +Date.now();
                    hasComp2++;
                    var hasCompReg2 = (100*hasComp2/len2).toFixed(2) +'%';
                    console.log( url + '，页面抓取完毕，' + '耗时' + (endTime - startTime) + '毫秒，第二阶段完成' + hasCompReg2);
                    setTimeout(function() {
                        // 有多个下载链接，选取第一个(一般是最优下载链接)
                        callback(null, movie);
                    }, delay);
                });
        };
        console.log('第二阶段：爬取每个电影页面的迅雷下载链接，开始'.debug);
        async.mapLimit(allMovieLinks, 10 ,function (url, callback) {
          reptileDown(url, callback);
        }, function (err,result) {
            console.log('第二阶段爬取结束'.debug);
            var realLinks = [];
            result.forEach(function(val, index){
                realLinks = realLinks.concat(val);
            });
            fs.writeFile('china_all_movies.json', JSON.stringify(realLinks));
            // 如果已经存在，直接读取即可
            // var data = fs.readFileSync('./china_all_movies.json', 'utf-8');
            // var realLinks = JSON.parse(data);
            var hasGotMovies = [];
            var hasComp3 = 0;
            var len3 = realLinks.length;
            // 根据url获取电影名称，去豆瓣网爬取影评分数
            var reptileSel = function(url,callback){
                var delay = 700;
                var obj = {
                    url: url,
                    rate: 0
                }
                // 匹配规则修改多次，为了兼容各种不统一的电影下载链接，基本能覆盖95%以上，评分过高和0的可能需要自己校对下
                var match = url.match(/]\.?([^\[\]]*?)(?:\.\[.*?\])?\.(mkv|mp4|rmvb|aac)$/);
                var txt = match ? match[1] : '';
                if(!txt){
                    hasComp3++;
                    console.log(('匹配不到电影名称：' + url).error);
                    fs.appendFileSync('debug.txt', '\n\n匹配不到电影名称：' + url);
                    callback(null, obj);
                    hasGotMovies.push(obj);
                    return;
                }
                // 匹配规则修改多次，为了兼容各种不统一的电影下载链接，基本能覆盖95%以上，评分过高和0的可能需要自己校对下
                var formatTxt = txt.split(/\.?(HD|BD|bd|DVD|720p|1024x\d{3,}|-?cd)/)[0];
                var startTime = +Date.now();
                var reqTxt = 'https://www.douban.com/search?cat=1002&q=' + formatTxt;
                var reqUrl = 'https://www.douban.com/search?cat=1002&q=' + encodeURIComponent(formatTxt);
                console.log( '正在抓取页面：' + reqTxt);
                var resend = function(){
                    superagent.get(reqUrl)
                    .timeout(5000)
                    .end(function(err,pres){
                          // 常规的错误处理
                        if (err) {
                            if(err.timeout){
                                console.log('重新请求' + reqTxt);
                                resend();
                                return;
                            }else{
                                console.log(('爬取过程因' + err.message + '而终止，但已经爬取的结果保存在china_part_movies_with_rate.json文件').error);
                                fs.appendFileSync('debug.txt', '\n\n爬取过程因' + err.message + '而终止，但已经爬取的结果保存在china_part_movies_with_rate.json文件');
                                fs.writeFile('china_part_movies_with_rate.json', JSON.stringify(hasGotMovies));
                                return;
                            }
                        }
                        var $ = cheerio.load(pres.text);
                        if($('.no-result').length > 0){
                            console.log(('豆瓣没有搜索到电影：' + url).error);
                            fs.appendFileSync('debug.txt', '\n\n豆瓣没有搜索到电影：' + url);
                        }else if($('.search-result').children().length === 1){
                            console.log(('豆瓣没有搜索到电影：' + url + '您下载的电影可能是禁片哦!').error);
                            fs.appendFileSync('debug.txt', '\n\n豆瓣没有搜索到电影：' + url + '您下载的电影可能是禁片哦!');
                            obj.rate = -1;
                        }else{
                            var getFirst = [];
                            $('.result .title a').each(function(index, el){
                                if($(el).text().trim() === formatTxt && $(el).prev().text() === "[电影]"){
                                    getFirst.push(parseFloat($('.rating_nums').eq(index).text() || 0));
                                }
                            })
                            if(getFirst.length === 0){
                                obj.rate = parseFloat($('.rating_nums').eq(0).text()) || 0;
                            }else{
                                obj.rate = getFirst[0];
                            }
                        }
                        // 因为豆瓣的爬取频次限制，这里改成一次爬取获得所有评分保存到json文件，以后需要自己读取再筛选
                        var endTime = +Date.now();
                        hasComp3++;
                        var hasCompReg3 = (100*hasComp3/len3).toFixed(2) +'%';
                        console.log( reqTxt + '，页面抓取完毕，' + '耗时' + (endTime - startTime) + '毫秒，第三阶段完成' + hasCompReg3);
                        setTimeout(function() {
                            callback(null, obj);
                            hasGotMovies.push(obj);
                        }, delay);
                    });
                }
                resend();
            };
            console.log('第三阶段：爬取相应豆瓣电影评分筛选，开始'.debug);
            async.mapLimit(realLinks, 1 ,function (url, callback) {
              reptileSel(url, callback);
            }, function (err,result) {
                console.log('第三阶段爬取结束'.debug);
                var formatResult = sortArrMethods.multiSortArr(result, [{name: 'rate', positive: false}]);
                fs.writeFile('china_all_movies_with_rate.json', JSON.stringify(formatResult), (err) => {
                    if (err) throw err;
                    var endTime = +Date.now();
                    console.log(('=============== 所有国内电影资源已爬取完毕！总耗时' + (endTime - startTime_all)/1000 + '秒 ===============').silly);
                });
            })
        })
    })
}
onRequest();







