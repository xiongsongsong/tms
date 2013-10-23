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
            res.render('tpl/edit-data', {docs: docs, result: JSON.stringify(result, undefined, '    ')})
        } else {
            res.end('404')
        }
    })
})