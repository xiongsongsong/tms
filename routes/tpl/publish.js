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
    var dir = dirpath.split(path.sep)
    var stepDir = []

    function createDirectory() {
        if (dir.length < 1) {
            callback()
            return
        }
        stepDir.push(dir.shift())
        var currentDir = path.join.apply(null, stepDir)
        fs.exists(currentDir, function (exists) {
            fs.lstat(currentDir, function (err, stats) {
                if (exists && stats && stats.isDirectory()) {
                    createDirectory()
                } else {
                    fs.mkdir(currentDir, function () {
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

    console.log('开始发布' + id)

    var data = new db.Collection(db.Client, 'tpl-source')
    data.find({page_id: id}).sort({ts: -1}).limit(1).toArray(function (err, doc) {
        if (err || !doc || doc.length < 1) {
            res.end('发布失败')
            console.log('未能找到' + id + '，发布失败')
            return
        }
        doc = doc[0]

        console.log('找到：' + doc.page_name + '，页面URL是' + doc.page_url + '，开始检查模板')

        //首先检测模板合法性
        var eachResult = helper.checkTemplate(doc.source)

        //如果存在一个错误的对象
        if (eachResult.err) {
            console.log('发现错误：', eachResult.err)
            res.json({err: eachResult.err})
            return
        }
        console.log('效验成功，开始编译模板')
        //开始编译模板
        compileTemplate(doc, eachResult, res)
    })
})


//负责将CMS语法转换为JS template语法
function translateTpl(param) {
    if (Array.isArray(param.tag) === false) return param.source
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

    res.header('content-type', 'text/plain;charset=utf-8')

    //获取ID信息
    var tag = doc.source.match(helper.tagRe)

    var dataIdArr = []
    if (Array.isArray(eachResult.arr)) {
        eachResult.arr.map(function (item) {
            dataIdArr.push(item.tab.id)
            return item.tab.id
        })
    }

    var pageUrl = path.join(helper.staticBaseDir, doc.page_url)
    var stream
    //负责存储数据
    var Data = '#run '
    var readyNum = 0
    var fieldsTable = {}
    //此变量存储CMS到Template的原始文本
    //首先获取文件的路径
    console.log('开始创建目录' + pageUrl + '的目录结构')
    mkdirs(path.dirname(pageUrl), function () {
        stream = fs.createWriteStream(pageUrl);
        stream.on('open', function () {
            console.log('文档已经打开，准备写入文档流')
            var data = new db.Collection(db.Client, 'data')

            //如果存在id，则说明需要用数据去渲染，否则就完全是一个静态页面
            if (dataIdArr.length > 0) {
                dataIdArr.forEach(function (item) {
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
                                console.log('开始编译并尝试发布')
                                source = template.compile(Data + source)
                                try {
                                    console.log('编译成功，开始尝试eval')
                                    template.render(source, {})
                                    console.log('eval成功，开始保存到磁盘')
                                    //更新页面缓存
                                    require('./go').update(doc.page_url.replace(/.jstpl$/, ''))
                                    stream.write(source)
                                    stream.end()
                                    console.log('保存完毕')
                                    res.end('发布成功，以下是编译后的结果\r\n' + source)
                                } catch (e) {
                                    res.end('编译模板时出现错误' + e + '----' + source)
                                }
                            } catch (e) {
                                console.log('编译失败')
                                res.write(e.toString())
                                res.write('\r\n<br>---------------------------------------------------------------------<br>')
                                res.end(source)
                            }
                        }
                    })
                })
            } else {
                try {
                    template.render(doc.source, {})
                    stream.write(doc.source)
                    stream.end()
                    res.end('发布成功\r\n' + doc.source)
                } catch (e) {
                    res.end('发布失败\r\n' + doc.source)
                }
            }
        });
    })
}
