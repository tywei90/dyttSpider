var fs = require('fs');

fs.readFile('./revised_china_all_movies_with_rate.json', 'utf-8', function(err, data){
    if (err) {
        console.log(err.message.error);
        return;
    }
    var dataArr = JSON.parse(data);
    var minRate = 7;
    var maxRate = 8;
    var optArr = [];
    for(var i=0, len=dataArr.length; i<len; i++){
        if(dataArr[i].rate >= minRate && dataArr[i].rate <= maxRate){
            optArr.push(dataArr[i].url);
        }
    }
    fs.writeFile('rate_in_' + minRate + 'and' + maxRate + '_movies.txt', optArr.join('\n'), (err) => {
        if (err) throw err;
        console.log('=============== 电影筛选完毕！ ===============');
    });
});