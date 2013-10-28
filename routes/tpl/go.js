/**
 * Created by 松松 on 13-10-28.
 */
var fs = require('fs')
var path = require('path')
var app = require('app')
var helper = require('./helper')
var template = require('template')

app.get(/^\/act\/(.+)/, function (req, res) {
    var page_url = req.params && req.params[0] ? req.params[0] : false
    if (!page_url) {
        res.status(404)
        res.end()
        return
    }

    var filePath = path.join(helper.staticBaseDir, page_url + '.jstpl')
    fs.readFile(filePath, function (err, buffer) {
        if (err) {
            res.status(404)
            return
        }
        res.end(template.render(buffer.toString(), {}))
    })
})