/**
 * Created by 松松 on 13-10-19.
 */

var allowRe = /^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5]+$/
var allowType = /^(string|img|number)$/i
var tagRe = /#each[\s]*\([\s\S]+?\)/gmi
var idRe = /id[\s]*:[\s]*([a-z0-9]{40}(?:[,)\s]))/
var crypto = require('crypto')

//检查并修正错误的id
exports.checkId = function (content, random) {
    var tag = content.match(tagRe)
    if (tag) {
        tag.forEach(function (item) {
            if (idRe.test(item) === false) {
                //如果ID不合法，就生成一个新的ID
                var newId = crypto.createHash('sha1');
                //随机因子+时间戳，保证生成的sha1效验和是唯一的
                newId.update(item + (typeof item === 'string' ? random : Math.random().toString()) + Date.now() + Math.random());
                //生成一个新id，在这之前删除掉错误的id
                content = content.replace(item, item.replace(/[\s\r\n]/gmi, '')
                    .replace(/id[\s]*:[\s]*[^,)\s]+/gi, '')
                    .replace(/(?:,,)/g, ',')
                    .replace(/,\)/g, ')')
                    .replace(/\)$/, ',id:' + newId.digest('hex') + ')'))
            } else {
                content = content.replace(item, item.replace(/[\s\r\n]/gm, ''))
            }
        })
    }
    return content
}

//检测页面名称
exports.checkPageName = function (str) {
    return typeof str === 'string' && str.trim().length > 0 ? str.trim() : false
}

//尝试优化页面URL并返回检测结果
var pageUrlRe = /^[a-zA-Z0-9-_/]+$/
exports.checkPageUrl = function (url) {
    url = typeof url === 'string' ? url.trim() : ''
    url = url.replace(/\/+/g, '/').replace(/^\/*|\/*$/g, '')
    return pageUrlRe.test(url) ? url : false
}

//检测模板中#each标签的合法性
exports.checkTemplate = function (content) {
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