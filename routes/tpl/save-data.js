/**
 * Created by 松松 on 13-10-26.
 */


var app = require('app')
var db = require('db')
var idRe = /^[a-z0-9]{40}$/
var helper = require('./helper')

app.post('/save-data', function (req, res) {
    var result = {err: []}
    if (!req.body) {
        result.status = -1
        result.err.push('参数不足')
        res.json(result)
    }

    //不能超过红楼梦的总字数
    if (req.body.data.length > 731017) {
        result.err.push('您提交的数据量太大，服务器无法处理');
        result.status = -2
        res.json(result)
        return
    }

    try {
        var json = JSON.parse(req.body.data)
    } catch (e) {
        result.status = -1
        result.err.push('参数解析错误')
        return
    }


    var transDate = []

    //验证每一个表格的错误
    Object.keys(json).forEach(function (item) {
        //验证是否合法的id序列
        if (idRe.test(item) === false) {
            delete json[item]
            return
        }
        var colNum = json[item].colNum
        //字段数量必须大于1或小于maxFieldNum
        if (isNaN(colNum) || colNum < 1 || colNum > helper.maxFieldNum) {
            delete json[item]
            result.err.push('字段数量错误:' + item + ',colNum->' + colNum)
            return
        }

        if (Array.isArray(json[item].data)) {
            //检查数组长度是否符合字段要求
            json[item].data = json[item].data.filter(function (arr) {

                if (!Array.isArray(arr) || colNum !== arr.length) {
                    return false
                }
                //只有任何一个单元格存在数据，则视为有效
                //所有数据必须是字符串
                var isString = 0
                var isContent = 0
                arr.forEach(function (val) {
                    if (typeof val !== 'string') {
                        isString--;
                        return
                    }
                    if (val.trim().length > 0) isContent++
                })
                return isString === 0 && isContent > 0
            })

            //存入数组，准备开始保存
            if (json[item].data.length > 0) {
                transDate.push({
                    id: item,
                    data: json[item].data,
                    ts: Date.now(),
                    owner_id: req.session._id
                })
            }
        } else {
            result.err.push(item + '没有包含所需要携带的数据')
        }
    })

    if (transDate.length < 1) {
        result.err.push('无法获取到您提交的数据，或者您提交的数据有误')
        result.status = -3
        res.json(result)
        return
    }

    var data = new db.Collection(db.Client, 'data')

    data.insert(transDate, {w: 1}, function (err, docs) {
        if (!err) {
            result.status = 1
            result.msg = "保存成功，共保存了" + docs.length + '条记录'
            delete result.err
        } else {
            result.err.push('未能保存任何记录,发成错误')
            result.status = 4
        }
        res.json(result)
    })
})

