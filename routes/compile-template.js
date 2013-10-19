/**
 * Created by 松松 on 13-10-16.
 */


var app = require('app')
var db = require('db')

var allowRe = /^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5]+$/
var allowType = /^(string|img|number)$/i
var tagRe = /#each[\s]*\([\s\S]+?\)/gmi
var idRe = /id[\s]*:[\s]*([a-z0-9]{40}(?:[,)\s]))/
var pageUrlRe = /^[a-zA-Z0-9-_/]+$/

var crypto = require('crypto')

//此方法负责给模板增加ID
app.post('/compile-template', function (req, res) {

    //获取标签字段信息
    var content = req.body.content;
    var pageName = req.body['page-name']
    var pageUrl = req.body['page-url']

    if (!pageName || !pageUrl || !content) {
        res.json({err: ['必要的参数不正确']})
        return
    }

    //移除多余的/符号，并把首尾可能存在的/删除掉
    pageUrl = pageUrl.trim().replace(/\/+/g, '/').replace(/^\/*|\/*$/g, '')

    //检测页面地址是否符合要求
    if (!pageUrlRe.test(pageUrl)) {
        res.json({err: ['页面地址不符合要求，只允许包含字母、连字符、下划线、翻斜杠（\/）。']})
        return
    }

    var tag = content.match(tagRe)

    if (tag) {
        tag.forEach(function (item) {
            if (idRe.test(item) === false) {
                //如果ID不合法，就生成一个新的ID
                var newId = crypto.createHash('sha1');
                newId.update(tag + req.sessionID + Date.now() + Math.random());
                content = content.replace(item, removeId(item, newId.digest('hex')))
            } else {
                content = content.replace(item, item.replace(/[\s\r\n]/gm, ''))
            }
        })
    }

    //首先检测模板合法性，如果模板存在语法错误，则直接告诉client进行修改
    try {
        checkTemplate(content)
    } catch (e) {
        res.json({err: e})
        return
    }


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
                                //目前页面URL是不可变的，记录是为了提高信息量
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

//移除Tag中的ID参数
function removeId(tag, newId) {
    tag = tag.replace(/[\s\r\n]/gmi, '')
    tag = tag.replace(/id[\s]*:[\s]*[^,)\s]+/gi, '')
    //删除多余的逗号
    tag = tag.replace(/(?:,,)/gi, ',')
    //删除末尾多余的逗号
    tag = tag.replace(/,\)/gi, ')')
    //将新生成的新ID附加上去
    tag = tag.replace(/\)$/, ',id:' + newId + ')')
    return tag
}

function checkTemplate(content) {
    //获取标签字段信息
    var tag = content.match(tagRe)
    var result = []
    var err = []

    if (!tag) return content
    tag.forEach(function (item) {
        var fail = []
        //获取字段描述信息
        var fieldValue = item.match(/fields:\{([^}]+)\}/)
        var field = fieldValue[1].replace(/\s/g, '').split(',')
        //获取Group
        var group = item.match(/group:([^\s,)]+)/)
        if (group) {
            group = group[1]
        } else {
            fail.push('没找到Group信息，原文本为：' + item)
        }
        //获取标题信息
        var title = item.match(/title:([^\s,)]+)/)
        if (title) {
            title = title[1]
        } else {
            fail.push('无法获取' + item + '的title信息')
        }

        field.forEach(function (item) {
            if (item.split(':').length !== 2) {
                fail.push(item + ' 必须用冒号指定字段的类型')
                return
            }
            item = item.split(':')
            if (allowRe.test(item[0]) === false) {
                fail.push(item[0] + ' 不符合字段类型，必须以汉字或英文字母开头，且不能包含标点符号')
            }
            if (allowType.test(item[1]) === false) {
                fail.push(item + ' 包含不允许的字段类型')
            }
        })

        //获取最大行数和默认行数
        //获取标题信息
        var row = item.match(/row:([^\s,)]+)/)
        if (row) {
            row = parseInt(RegExp.$1, 10)
            if (isNaN(row) || row < 1 || row > 20001) {
                fail.push('行数信息出错:-->' + item + '，只能大>1且<20001')
            }
        } else {
            row = 1
        }

        var defaultRow = item.match(/defaultRow:([^\s,)]+)/)
        if (defaultRow) {
            defaultRow = parseInt(RegExp.$1, 10)
            if (isNaN(defaultRow) || defaultRow < 1 || defaultRow > 20001) {
                fail.push('总行数信息出错:-->' + item + '，只能大>1且<20001')
            }
        } else {
            defaultRow = 1
        }

        if (defaultRow > row) {
            fail.push('行数不能超过defaultRow')
        }

        //获取ID参数

        //如果所有效验通过，则进行存储
        if (fail.length < 1) {
            result.push({
                group: group,
                title: title,
                field: field,
                row: row,
                defaultRow: defaultRow,
                tpl: item
            })
        } else {
            err.push(fail + ',原文本为：' + item)
        }
    })
    if (err.length > 0) {
        console.log('语法存在错误：' + err)
        throw err
    } else {
        return result
    }
}

//此方法负责给模板增加ID
app.get('/get-template-field', function (req, res) {


})
