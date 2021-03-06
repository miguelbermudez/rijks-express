
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongo = require('./routes/mongoprovider')
  , imgColor = require('./routes/image');

var app = express();

//set maxsocketsss
http.globalAgent.maxSockets = 50;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/collections', mongo.getCollections);
app.get('/paintings', mongo.getPaintings);
app.get('/painting/:id', mongo.getPainting);
app.get('/image', mongo.getImage);
app.get('/resize/:dimensions', mongo.resizeImage);
app.get('/color/palette/:id', imgColor.getPalette);
app.get('/color/dominant/:id', imgColor.getDominantColor);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
