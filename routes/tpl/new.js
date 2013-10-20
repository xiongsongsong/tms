/**
 * Created by 松松 on 13-10-20.
 */

var app = require('app')
var db = require('db')
var helper = require('./helper')

//此方法负责给模板增加ID
app.post('/compile-template', function (req, res) {

    //获取标签字段信息
    var content = req.body.content;
    var pageName = req.body['page_name']
    var pageUrl = req.body['page_url']
    var err = []

    //检测页面名称
    pageName = helper.checkPageName(pageName)
    if (!pageName) err.push('错误的页面名称')

    //检测页面URL
    pageUrl = helper.checkPageUrl(pageUrl)
    if (!pageUrl) err.push('错误的页面地址')

    //检测页面ID并尝试修正错误或为空的ID
    content = helper.checkId(content, req.sessionID)

    if (err.length > 0) {
        res.json({err: err})
        return
    }

    //首先检测模板合法性，如果模板存在语法错误，则直接告诉client进行修改
    try {
        helper.checkTemplate(content)
    } catch (e) {
        res.json({err: e})
        return
    }

    //开始存储模板
    var tpl = new db.Collection(db.Client, 'tpl')
    var tplSource = new db.Collection(db.Client, 'tpl-source')

    //首先查询URL是否已经被使用了
    //status:1代表正常状态，删除的状态为-1
    tpl.findOne({page_url: pageUrl, status: 1}, {_id: 1, page_name: 1}, function (err, docs) {
            if (!err) {
                if (docs) {
                    res.json({err: '页面已经存在，页面名称为' + docs.page_name})
                } else {
                    //开始存储页面名称
                    tpl.insert({
                        page_url: pageUrl,
                        page_name: pageName,
                        owner_id: req.session._id,
                        owner_name: req.session.name,
                        status: 1,
                        ts: Date.now()
                    }, {}, function (err, docs) {
                        console.log(docs)
                        if (!err && docs && docs[0]) {
                            //开始存储模板文件
                            tplSource.insert({
                                page_id: docs[0]._id,
                                //页面名称是可变的，故每次都记录值
                                page_name: pageName,
                                //目前页面URL是不可变的，记录是为了提高信息量便于以后扩展
                                page_url: pageUrl,
                                source: content,
                                owner_id: req.session._id,
                                owner_name: req.session.name,
                                ts: Date.now()
                            }, {}, function (err, docs) {
                                if (!err) {
                                    res.json({docs: docs})
                                } else {
                                    res.json({err: err})
                                }
                            })
                        } else {
                            res.json({err: ['无法保存模板']})
                        }
                    })
                }
            } else {
                res.json({err: '查询页面过程中出现错误'})
            }
        }
    )
})
