/**
 * Created by 松松 on 13-10-19.
 */


var app = require('app')
var db = require('db')


app.get(/\/edit\/(.+)/, function (req, res) {
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
            res.render('tpl/edit-source', docs)
        } else {
            res.end('404')
        }
    })

})