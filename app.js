var express = require('express')
var http = require('http')
var path = require('path')

var app = express()

// all environments
app.set('port', process.env.PORT || 8000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.use(express.favicon())
app.use(express.logger('dev'))
app.use(express.bodyParser())
app.use(express.compress())
app.use(express.methodOverride())
app.use(express.cookieParser('your secret here'))
app.use(express.session())
app.use(app.router)
app.use(require('stylus').middleware(path.join(__dirname, 'assets')))
app.use(express.static(path.join(__dirname, 'assets')))

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler())
}

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'))
})

exports.app = app

require('./routes')