/**
 * Created by 松松 on 13-10-27.
 */

var app = require('app')
var db = require('db')
var helper = require('./helper')
var fs = require('fs')
var path = require('path')

//递归创建所有目录
var mkdirs = function (dirpath, mode, callback) {
    fs.exists(dirpath, function (exists) {
        if (exists) {
            callback(dirpath);
        } else {
            //尝试创建父目录，然后再创建当前目录
            mkdirs(path.dirname(dirpath), mode, function () {
                fs.mkdir(dirpath, mode, callback);
            });
        }
    });
};


app.get(/\/publish\/([a-z0-9]{24})/, function (req, res) {
    //将页面URL根据 / 存储在磁盘之上
    var ObjectId = db.mongodb.ObjectID
    try {
        var id = ObjectId(req.params[0])
    } catch (e) {
        res.status(500)
        res.end()
        return
    }

    var data = new db.Collection(db.Client, 'tpl-source')
    data.find({page_id: id}).sort({ts: -1}).limit(1).toArray(function (err, doc) {
        if (err || !doc || doc.length < 1) {
            res.end('发布失败')
            return
        }
        doc = doc[0]

        //首先检测模板合法性
        var eachResult = helper.checkTemplate(doc.source)
        //如果存在一个错误的对象
        if (eachResult.err) {
            res.json({err: eachResult.err})
            return
        }
        //开始编译模板
        var template = compileTemplate(doc, eachResult)
    })
})

function compileTemplate(doc, eachResult) {
    //获取ID信息
    var result = doc.source.match(helper.tagRe)
    if (!result) return doc.source

    var dataIdArr = eachResult.arr.map(function (item) {
        return item.tab.id
    })

    if (!Array.isArray(dataIdArr)) {
        return doc.source
    }

    var pageUrl = path.join(__dirname, 'cms', doc.page_url)
    var stream
    var idLength = dataIdArr.length;
    var readyNum = 0
    //首先获取文件的路径
    mkdirs(path.dirname(pageUrl), '0777', function () {
        stream = fs.createWriteStream(pageUrl);
        stream.on('open', function () {
            dataIdArr.forEach(function (item) {
                var data = new db.Collection(db.Client, 'data')
                console.log(item)
                data.find({id: item}).sort({ts: -1}).limit(1).toArray(function (err, doc) {
                    readyNum++
                    if (doc && doc[0]) {
                        stream.write('var _' + item + '=' + JSON.stringify(doc[0], undefined, '\t') + '\r\n')
                    }
                    if (readyNum === dataIdArr.length) {
                        console.log('完成拉')
                        stream.end()
                    }
                })
            })
            /* stream.write(dataIdArr.toString())
             */
            /*stream.write("My first row\n");
             stream.write("My second row\n");
             stream.end();*/
            /*
             stream.end()*/
        });
    })


}

//将数据库内容写入文本