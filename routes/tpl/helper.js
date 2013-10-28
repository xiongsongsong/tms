/**
 * Created by 松松 on 13-10-19.
 */

var fieldRe = /^[a-zA-Z\u4e00-\u9fa5]+[a-zA-Z0-9\u4e00-\u9fa5]*$/
var allowType = /^(string|img)$/i
var tagRe = /#each[\s]*\{[\s\S]+?\}/gmi
var idRe = /id[\s]*:[\s]*([a-z0-9]{40})/
var crypto = require('crypto')
var maxNum = 6000

exports.tagRe = tagRe
exports.idRe = idRe
exports.fieldRe = fieldRe
exports.maxNum = maxNum
//最多允许有50个字段
exports.maxFieldNum = 50

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
                content = content.replace(item, item.replace(/id[\s]*:[\s]*[^,}\s]+/gi, '')
                    .replace(/(?:,,)/g, ',')
                    .replace(/,\}/g, '}')
                    .replace(/\}$/, ',id:' + newId.digest('hex') + '}'))
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
    return pageUrlRe.test(url) ? url + '.jstpl' : false
}

//将模板中#each中的的属性检索出来
//如果没有任何错误，则返回所有字段定义
//否则返回错误信息
exports.checkTemplate = function (content) {
    //获取标签字段信息
    var tag = content.match(tagRe)
    //存放字段定义的信息
    var result = {status: 1, arr: [], warning: []}
    //存放错误的信息
    var errResult = {status: -1, err: []}
    if (!tag) return content
    tag.forEach(function (item) {
        var fail = []
        var param = exports.searchParam(item)
        if (param.tab.group === undefined) {
            fail.push('没找到group定义')
        }
        if (param.tab.title === undefined) {
            fail.push('没找到title定义')
        }
        param.tab.row = parseInt(param.tab.row, 10)
        param.tab.defaultRow = parseInt(param.tab.defaultRow, 10)

        //最大上线为6000条
        if (param.tab.row > maxNum) {
            param.tab.row = maxNum
            result.warning.push('至多支持' + maxNum + '条数据，已更改为' + maxNum + '条')
        }


        if (isNaN(param.tab.row) || param.tab.row < 1) {
            param.tab.row = 1
            result.warning.push('row定义出现问题，默认将使用1')
        }

        if (isNaN(param.tab.defaultRow) || param.tab.defaultRow < 1) {
            param.tab.defaultRow = 1
            result.warning.push('defaultRow出现问题，默认将使用1')
        }

        if (param.tab.defaultRow > param.tab.row) {
            param.tab.defaultRow = param.tab.row
            result.warning.push('defaultRow不能大于row，已将defaultRow的值替换为row')
        }

        //检查字段的定义是否有错误
        var keys = Object.keys(param.fields)
        keys.forEach(function (key) {
            var type = param.fields[key].type
            if (!allowType.test(type)) {
                fail.push('字段类型错误：' + type)
            }
            if (!fieldRe.test(type)) {
                fail.push('字段名称错误，必须以中文或英文字母开头：' + type)
            }
        })

        if (keys.length < 1) fail.push('未定义任何字段信息')

        if (fail.length > 0) {
            errResult.err.push({text: item, msg: fail})
        } else {
            result.arr.push(param)
        }
    })

    if (result.warning.length < 1) delete result.warning
    return errResult.err.length > 0 ? errResult : result;
}

exports.searchParam = function (content) {
    var fields = {}
    var tab = {}
    content.match(/\{([\s\S]+?)\}/)[1].split(',').forEach(function (item) {
        item = item.replace(/[\r\n]/gm, '').split(':')
        if (item.length === 2) {
            tab[item[0].trim()] = item[1].trim()
        } else if (item.length === 3) {
            fields[item[0].trim()] = {
                tip: item[1].trim(),
                type: item[2].trim()
            }
        }
    })
    return {
        tab: tab,
        fields: fields
    }
}
