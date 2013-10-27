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
    var tag = doc.source.match(helper.tagRe)
    if (!tag) return doc.source

    var dataIdArr = eachResult.arr.map(function (item) {
        return item.tab.id
    })

    if (!Array.isArray(dataIdArr)) {
        return doc.source
    }

    var pageUrl = path.join(__dirname, 'cms', doc.page_url)
    var stream
    var readyNum = 0
    var fieldsTable = {}
    //首先获取文件的路径
    mkdirs(path.dirname(pageUrl), '0777', function () {
        stream = fs.createWriteStream(pageUrl);
        stream.on('open', function () {
            dataIdArr.forEach(function (item) {
                var data = new db.Collection(db.Client, 'data')
                data.find({id: item}, {fields: {fields: 1, data: 1, ts: 1, _id: 0}}).sort({ts: -1}).limit(1).toArray(function (err, tpl) {
                    readyNum++
                    if (tpl && tpl[0]) {
                        stream.write('#run var _' + item + '=' + JSON.stringify(tpl[0]) + '\r\n')
                        fieldsTable[item] = {fields: tpl[0].fields}
                    }
                    if (readyNum === dataIdArr.length) {
                        translateTpl({
                            stream: stream,
                            tag: tag,
                            fieldsTable: fieldsTable,
                            source: doc.source
                        })
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

//负责将CMS语法转换为JS         template语法
function translateTpl(param) {
    param.tag.forEach(function (tag) {
        var id = tag.match(helper.idRe)
        if (id) {
            var str = '#each(_' + id[1] + '_ in _' + id[1] + ')\r\n'
            //找到该ID的字段定义
            param.fieldsTable[id[1]].fields.forEach(function (k, i) {
                str += '#run var ' + k + ' = _' + id[1] + '_[' + i + ']\r\n'
            })
            param.stream.write(str)
        }
    })
    param.stream.end()
}
