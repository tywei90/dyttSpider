let http = require("http"),
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
let total = 4;
let delay = 180*1000;
let ajaxUrl = 'https://www.lmlc.com/s/web/home/user_buying';

if(!fs.existsSync('user.json')){
    fs.writeFileSync('user.json', '');
}
if(!fs.existsSync('originUser.json')){
    fs.writeFileSync('originUser.json', '');
}

let timer = setInterval(function() {
    requestData(ajaxUrl);
}, delay);

requestData(ajaxUrl);

function formatData(data){
    let outArr = [];
    for(let i=0, len=data.length; i<len; i++){
        delete data[i].userPic;
        data[i].buyTime = +new Date() - data[i].time;
        data[i].uniqueId = data[i].payAmount.toString() + data[i].productId + data[i].username;
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
        // console.log(newData);
        let formatNewData = formatData(newData);
        let data = fs.readFileSync('user.json', 'utf-8');
        let originData = fs.readFileSync('originUser.json', 'utf-8');
        if(!data){
            fs.writeFile('user.json', JSON.stringify(formatNewData), (err) => {
                if (err) throw err;
                let time = (new Date()).format("yyyy-MM-dd hh:mm:ss");
                console.log((`=============== 第${counter}次爬取，时间：${time} ===============`).silly);
            });
            fs.writeFile('originUser.json', JSON.stringify(formatNewData), (err) => {
                if (err) throw err;
            });
        }else{
            let oldData = JSON.parse(data);
            originData = JSON.parse(originData);
            let addData = [];
            fs.writeFile('originUser.json', JSON.stringify(originData.concat(formatNewData)), (err) => {
                if (err) throw err;
            });
            for(let i=0, len=formatNewData.length; i<len; i++){
                let matchArr = [];
                for(let len2=oldData.length, j=Math.max(0,len2 - 20); j<len2; j++){
                    if(formatNewData[i].uniqueId === oldData[j].uniqueId){
                        matchArr.push(j);
                    }
                }
                if(matchArr.length === 0){
                    addData.push(formatNewData[i]);
                }else{
                    let isNewBuy = true;
                    for(let k=0, len3=matchArr.length; k<len3; k++){
                        let delta = formatNewData[i].time - oldData[matchArr[k]].time;
                        if(delta == 0 || (Math.abs(delta - 3*60*1000) < 1000)){
                            isNewBuy = false;
                            oldData[matchArr[k]].time = formatNewData[i].time;
                        }
                    }
                    if(isNewBuy){
                        addData.push(formatNewData[i]);
                    }
                }
            }
            fs.writeFile('user.json', JSON.stringify(oldData.concat(addData)), (err) => {
                if (err) throw err;
                let time = (new Date()).format("yyyy-MM-dd hh:mm:ss");
                console.log((`=============== 第${counter}次爬取，时间：${time} ===============`).silly);
            });
        }
    });
}







