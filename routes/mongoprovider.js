/**
 * Created with JetBrains WebStorm.
 * User: Miguel Bermudez
 * Date: 5/21/13
 * Time: 1:51 AM
 * To change this template use File | Settings | File Templates.
 */

var MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    url = require('url'),
    im = require('imagemagick'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime-magic'),
    request = require('request'),
    appRunDirname = require('path').dirname(require.main.filename),
    db;

var mongoClient = new MongoClient(new Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {
  db = mongoClient.db('rijks');
  db.collection('paintings', {strict:true}, function(err, collection) {
    if (err) {
      console.log("The 'paintings' collection doesn't exist");
    }
  });
});

exports.getCollections = function(req, res) {
  db.collectionNames(function(err, collections) {
    res.jsonp(collections);
  });
};

exports.getPaintings = function(req, res) {
  console.log("params: ", req.params);
  var skip, page_size;

  page_size = 10
  skip = parseInt(req.query.skip) || 0;
  if (skip < 0) { skip = 0; }
  console.log("\tskip: ", skip, ' pagesz: ', page_size);

  db.collection('paintings').find( {}, { 'skip': skip, 'limit': page_size } ).toArray(function(err, docs) {
    res.jsonp(docs);
  });
};

exports.getPainting = function(req, res) {
  console.log("params: ", req.params);
  var id;

  id = req.params.id;
  console.log("id: ", id);
  db.collection('paintings').find({work_id: id }).toArray(function(err, work) {
    res.jsonp(work);
  });
};

exports.resizeImage = function(req, res) {
  console.log("params: ", req.params);
  var dimensions, _url, filename, dstFilename_full
    , dstFilename, r, imOptions;

  //dimensions from url
  dimensions = req.params.dimensions;

  //url parts
  _url = req.query.url;
  _url = url.parse(_url);

  //filenames
  filename = _url.query.toLowerCase().match(/=(.+)$/i)[1]
  dstFilename = path.resolve(appRunDirname, 'image-cache', filename + ".jpeg");
  dstFilename_full = path.resolve(appRunDirname, 'image-cache', filename + "-full.jpeg");
  imOptions = {
    srcPath: dstFilename_full,
    dstPath: dstFilename,
    quality: 60,
    progressive: true,
    filter: 'box',
    width: 1000,
    height: 2000
  };

  //get original image
  r = request(_url.href).pipe(fs.createWriteStream(dstFilename_full));
  //when original image is done dowloading...
  r.on('close', function() {

    //resize image
    im.resize(imOptions, function(err, stdout, stderr) { postImgResize(err); });
  });

  var postImgResize = function(err) {
    if (err) throw err;
    console.log('resized ' + filename + '.jpeg to fit ' + dimensions);
    getFileStat();
  }

  var getFileStat = function() {
    fs.stat(dstFilename_full, function(err, stat) { postFileStat(err, stat); });
  }

  var postFileStat = function(err, stat) {
    if (err) throw err;
    sendImage(res, dstFilename, stat);
  }
};

exports.getImage = function(req, res) {
  var imageId, cachedImgFilename, isFullImgReq;

  imageId = req.query.id;
  isFullImgReq = req.query.full;
  if (isFullImgReq) {
    cachedImgFilename  = path.resolve(appRunDirname, 'image-cache', imageId + "-full.jpeg");
  } else {
    cachedImgFilename  = path.resolve(appRunDirname, 'image-cache', imageId + ".jpeg");
  }

  fs.stat(cachedImgFilename, function(err, stat) {
    if (!err) {
      res.setHeader('Last-Modified', stat.mtime);
      sendImage(res, cachedImgFilename, stat);
    }
    else {
      console.log('redirecting...');
      res.redirect('resize/1000x2000?url=https://www.rijksmuseum.nl/assetimage2.jsp?id=' + imageId);
    }
  })
};

var sendImage = function(res, f, stat) {
  var etag = stat.size + '-' + Date.parse(stat.mtime);
  fs.readFile(f, function(err, img) {
    mime(f, function(err, mimeType) {
      if (!err) {
        console.log('image type: ', mimeType);
        res.setHeader('Last-Modified', stat.mtime);
        res.setHeader('Content-Length', img.length);
        res.setHeader('ETag', etag);
        res.setHeader("Content-Type", mimeType);
        res.statusCode = 302;
        res.end(img, 'binary');
      }
    });
  });
};

