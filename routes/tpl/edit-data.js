/**
 * Created by 松松 on 13-10-22.
 */

var app = require('app')
var db = require('db')
var helper = require('./helper')

app.get(/\/edit\/data\/(.+)/, function (req, res) {
    var tplSource = new db.Collection(db.Client, 'tpl-source')
    var ObjectId = db.mongodb.ObjectID
    try {
        var id = ObjectId(req.params[0])
    } catch (e) {
        res.end('err:' + e)
        return
    }
    var tplSource = new db.Collection(db.Client, 'tpl-source')
    tplSource.findOne({page_id: id}, {sort: [
        ['ts', -1]
    ]}, function (err, docs) {
        if (!err && docs) {
            //开始获取模板的编辑数据
            var result = helper.checkTemplate(docs.source)

            //查询全部的数据
            var idArr = []
            result.arr.forEach(function (item) {
                if (idArr.indexOf(item.tab.id) < 0) idArr.push(item.tab.id)
            })

            var data = new db.Collection(db.Client, 'data')
            var readyNum = 0
            var data = new db.Collection(db.Client, 'data')
            idArr.forEach(function (item) {
                data.find({id: item}, {fields: {fields: 1, data: 1, ts: 1, _id: 0}}).sort({ts: -1}).limit(1).toArray(function (err, tpl) {
                    readyNum++
                    if (!err && tpl && tpl[0]) {
                        result[item] = tpl[0]
                    }
                    if (readyNum === idArr.length) {
                        res.render('tpl/edit-data', {docs: docs, result: JSON.stringify(result, undefined, '    ')})
                    }
                })
            })
        } else {
            res.end('404')
        }
    })
})