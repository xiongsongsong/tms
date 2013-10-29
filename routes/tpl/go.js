/**
 * Created by 松松 on 13-10-28.
 */
var fs = require('fs')
var path = require('path')
var app = require('app')
var helper = require('./helper')
var template = require('template')

exports.cache = Object.create(null)

//缓存在内存中存活的阈值
exports.ExpiresTs = 3600000

app.get(/^\/go\/(.+)/, function (req, res) {
    var page_url = req.params && req.params[0] ? req.params[0] : false
    if (!page_url) {
        res.status(404)
        res.end()
        return
    }

    res.header('content-type', 'text/html;charset=utf-8')

    if (exports.cache[page_url]) {
        res.end(template.render(exports.cache[page_url].source, {}))
        //更新时间戳
        exports.cache[page_url].ts = Date.now()
    } else {
        var filePath = path.join(helper.staticBaseDir, page_url + '.jstpl')
        fs.readFile(filePath, function (err, buffer) {
            if (err) {
                res.status(404)
                return
            }
            res.end(template.render(buffer.toString(), {}))
            exports.cache[page_url] = Object.create(null)
            exports.cache[page_url].source = buffer.toString()
            exports.cache[page_url].ts = Date.now()
            //将内存中超过maxExpiresTs阈值的缓存清除掉
            exports.clearMemory()
        })
    }
})

//通过删除缓存，达到更新的目的
exports.update = function (page_url) {
    if (exports.cache[page_url]) {
        delete exports.cache[page_url]
        console.log('更新了' + page_url + '的缓存')
    }
}

//将访问量少的页面，从内存中移除
exports.clearMemory = function () {
    Object.keys(exports.cache).forEach(function (item) {
        if (Date.now() - exports.cache[item].ts > exports.ExpiresTs) {
            delete exports.cache[item]
        }
    })
}
