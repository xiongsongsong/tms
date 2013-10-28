/**
 * Created by 松松 on 13-10-27.
 */

var app = require('app')
var db = require('db')
var helper = require('./helper')
var fs = require('fs')
var path = require('path')
var template = require('template')

//递归创建所有目录
var mkdirs = function (dirpath, callback) {

    //文件夹目录的数组
    var dir = dirpath.split(path.sep)
    //累加文件夹路径，便于一个一个的创建
    var stepDir = []

    function createDirectory() {
        if (dir.length < 1) {
            callback()
            return
        }
        stepDir.push(dir.shift())
        var currentDir = path.join.apply(null, stepDir)
        fs.exists(currentDir, function (exists) {
            //检测是否为一个目录
            fs.lstat(currentDir, function (err, stats) {
                //如果当前已经为一个目录，则创建下层目录
                if (exists && stats && stats.isDirectory()) {
                    console.log(currentDir + '是已经存在的目录')
                    createDirectory()
                } else {
                    console.log(currentDir + '不存在这个目录，开始创建')
                    fs.mkdir(currentDir, function (a, b) {
                        console.log(currentDir + '的创建结果' + a + b)
                        createDirectory()
                    })
                }
            })
        })
    }

    createDirectory()
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
        compileTemplate(doc, eachResult, res)
    })
})


//负责将CMS语法转换为JS         template语法
function translateTpl(param) {
    param.tag.forEach(function (tag) {
        var id = tag.match(helper.idRe)
        if (id) {
            var str = ''
            //如果定义了字段或数据（特殊情况是，用户保存了模板，但还未保存任何数据）
            if (param.fieldsTable[id[1]]) {
                //如果未定义字段
                if (param.fieldsTable[id[1]] === undefined) return
                str = '\r\n#each(_' + id[1] + '_ , _Index , _Arr in _' + id[1] + '.data)\r\n'
                //找到该ID的字段定义
                str += '#run '
                param.fieldsTable[id[1]].fields.forEach(function (k, i, arr) {
                    str += ' var ' + k + ' = _' + id[1] + '_[' + i + '];'
                })
                str += '\r\n'
            }
            //构造一个空的循环
            else {
                str = '\r\n#each(empty in [])\r\n'
            }
            param.source = param.source.replace(tag, str)
        }
    })
    return param.source
}

function compileTemplate(doc, eachResult, res) {
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
    //负责存储数据
    var Data = '#run '
    var readyNum = 0
    var fieldsTable = {}
    //此变量存储CMS到Template的原始文本
    //首先获取文件的路径
    mkdirs(path.dirname(pageUrl), function () {
        stream = fs.createWriteStream(pageUrl);
        stream.on('open', function () {
            dataIdArr.forEach(function (item) {
                var data = new db.Collection(db.Client, 'data')
                data.find({id: item}, {fields: {fields: 1, data: 1, ts: 1, _id: 0}}).sort({ts: -1}).limit(1).toArray(function (err, tpl) {
                    readyNum++
                    if (tpl && tpl[0]) {
                        Data += ' var _' + item + '=' + JSON.stringify(tpl[0]) + ';'
                        fieldsTable[item] = {fields: tpl[0].fields}
                    }
                    if (readyNum === dataIdArr.length) {
                        //换行符表示数据区域结束
                        Data += '\r\n'
                        var source = translateTpl({
                            tag: tag,
                            fieldsTable: fieldsTable,
                            source: doc.source
                        })
                        Data += '\r\n'
                        try {
                            source = template.compile(Data + source)
                            try {
                                res.end('发布成功！' + template.render(source, {}))
                                stream.write(source)
                                stream.end()
                            } catch (e) {
                                res.end('编译模板时出现错误' + e + '----' + source)
                            }
                        } catch (e) {
                            res.write(e.toString())
                            res.write('\r\n<br>---------------------------------------------------------------------<br>')
                            res.end(source)
                        }
                    }
                })
            })
        });
    })
}
