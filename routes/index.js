/*
 * GET home page.
 */

exports.index = function (req, res) {
    res.render('index', { title: 'Express' });
};
var app = require('app')
var db = require('db')

app.get('/', function (req, res) {
    var tpl = new db.Collection(db.Client, 'tpl')
    tpl.find({status: 1}, {}).sort({ts: -1}).toArray(function (err, docs) {
        res.render('index', {docs: docs})
    })
})


//模板的一切
require('./tpl')