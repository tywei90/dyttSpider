# 基于 nodejs 的电影天堂爬虫项目

运行方式
```
node crawl_top_movies.js  // 爬取电影天堂top200电影资源
node crawl_china_movies.js  // 爬取电影天堂所有国内电影资源
```

## 相关博文

具体使用请看：

[【node爬虫】前端爬虫系列「博客园」爬虫](http://www.cnblogs.com/coco1s/p/4954063.html)

## 说明：
1、sortArr.js文件是之前写的一个对象数组排序的工具

2、网站可能会更新，但是文档结构几乎不变，只需要更改下页码即可

3、爬取的结果已经保存，IMDB评分8以上电影top200：top200_movies.txt; 所有国内电影(手动修正过)：revised_china_all_movies_with_rate.json

4、json文件是带有评分的，如果要获得评分在某个区间的所有电影，修改choose.js文件的minRate和maxRate值，然后执行即可

5、最新影片和欧美电影的爬取代码和爬取国内电影一样，只需要更改下链接地址和页数即可

6、如何下载我们爬取到的电影链接应该不需要多说了吧，用过迅雷的人都知道