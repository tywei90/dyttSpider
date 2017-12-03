let superagent = require('superagent-charset'),
    fs = require('fs'),
    colors = require('colors');

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

//日期格式化，格式化后:2016-03-09 11:20:12
Date.prototype.format = function(format) {
    var o = {
        "M+": this.getMonth() + 1, //month 
        "d+": this.getDate(), //day 
        "h+": this.getHours(), //hour 
        "m+": this.getMinutes(), //minute 
        "s+": this.getSeconds(), //second 
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter 
        "S": this.getMilliseconds() //millisecond 
    }
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format))
            format = format.replace(RegExp.$1,
                RegExp.$1.length == 1 ? o[k] :
                ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}

let counter = 0;
let total = 5;
let delay = 5*1000;
let ajaxUrl = 'https://www.lmlc.com/web/product/product_list?pageSize=10&pageNo=1&type=0';

if(!fs.existsSync('product.json')){
    fs.writeFileSync('product.json', '');
}

let timer = setInterval(function() {
    requestData(ajaxUrl);
}, delay);

requestData(ajaxUrl);

function formatData(data){
    let outArr = [];
    for(let i=0, len=data.length; i<len; i++){
        delete data[i].productPic;
        data[i].buyTime = +new Date() - data[i].time;
        data[i].uniqueId = data[i].payAmount.toString() + data[i].productId + data[i].productname;
        outArr.push(data[i]);
    }
    return outArr
}

function requestData(url) {
    counter++;
    if(counter == total){
        clearInterval(timer);
    }
    superagent.get(url)
    .end(function(err,pres){
        // 常规的错误处理
        if (err) {
          console.log(err.message.error);
          return;
        }
        let newData = JSON.parse(pres.text).data;
        if(newData.totalPage > 1){
            console.log('产品列表不止一页！'.error);
        }
        let formatNewData = formatData(newData.result);
        let data = fs.readFileSync('product.json', 'utf-8');
        if(!data){
            fs.writeFile('product.json', JSON.stringify(formatNewData), (err) => {
                if (err) throw err;
                let time = (new Date()).format("yyyy-MM-dd hh:mm:ss");
                console.log((`=============== 第${counter}次爬取，时间：${time} ===============`).silly);
            });
        }else{
            fs.writeFile('product.json', JSON.stringify(oldData.concat(addData)), (err) => {
                if (err) throw err;
                let time = (new Date()).format("yyyy-MM-dd hh:mm:ss");
                console.log((`=============== 第${counter}次爬取，时间：${time} ===============`).silly);
            });
        }
    });
}







