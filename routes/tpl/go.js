/**
 * Created by 松松 on 13-10-28.
 */
var fs = require('fs')
var path = require('path')
var app = require('app')
var helper = require('./helper')
var template = require('template')

//在内存中存放500个页面

var cache = Object.create(null)


app.get(/^\/act\/(.+)/, function (req, res) {
    var page_url = req.params && req.params[0] ? req.params[0] : false
    if (!page_url) {
        res.status(404)
        res.end()
        return
    }

    var filePath = path.join(helper.staticBaseDir, page_url + '.jstpl')
    if (cache[filePath]) {
        res.end((template.render(cache[filePath], {})))
        if (Object.keys(cache).length > 1000) {
            cache = Object.create(null)
        }
    } else {
        fs.readFile(filePath, function (err, buffer) {
            if (err) {
                res.status(404)
                return
            }
            cache[filePath] = buffer.toString()
            res.end(template.render(cache[filePath], {}))
        })
    }
})