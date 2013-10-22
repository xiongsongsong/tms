/**
 * Created by 松松 on 13-10-20.
 */


var app = require('app')
var db = require('db')
var helper = require('./helper')

app.get(/\/edit\/source\/(.+)/, function (req, res) {
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

//保存源码更新
app.post('/edit/update-source', function (req, res) {

    //获取标签字段信息
    var content = req.body.content;
    var pageName = req.body['page_name']
    var pageUrl = req.body['page_url']
    var err = []

    try {
        var page_id = db.mongodb.ObjectID(req.body.page_id)
    } catch (e) {
        res.json({status: -1, err: ['错误的id参数']})
        return
    }

    //检测页面名称
    pageName = helper.checkPageName(pageName)
    if (!pageName) err.push('错误的页面名称')

    //检测页面ID并尝试修正错误或为空的ID
    content = helper.checkId(content, req.sessionID)

    if (err.length > 0) {
        res.json({status: -2, err: err})
        return
    }

    //首先检测模板合法性，如果模板存在语法错误，则直接告诉client进行修改
        var eachResult = helper.checkTemplate(content)


    if (eachResult.err) {
        res.json({err: eachResult.err})
        return
    }

    //todo:检测id参数的合法性，是否为作者本人所更新
    //todo:检测即将更新到的url，是否已经被占用

    //开始更新一个新的版本

    //首先查询这个页面是否存在

    var tpl = new db.Collection(db.Client, 'tpl')
    var tplSource = new db.Collection(db.Client, 'tpl-source')

    tpl.findOne({_id: page_id}, {_id: 1, page_name: 1, page_url: 1}, function (err, docs) {
        if (!err && docs) {
            tplSource.insert({
                page_id: page_id,
                //页面名称是可变的，故每次都记录值
                page_name: pageName,
                //目前页面URL是不可变的，记录是为了提高信息量便于以后扩展
                page_url: docs.page_url,
                source: content,
                owner_id: req.session._id,
                owner_name: req.session.name,
                ts: Date.now()
            }, {}, function (err, docs) {
                res.json({status: 1, msg: '成功更新模板'})
            })
        } else {
            res.json({status: -4, err: '您更新的页面不存在'})
        }
    })
})