/**
 * Created with JetBrains WebStorm.
 * User: Miguel Bermudez
 * Date: 5/25/13
 * Time: 12:57 AM
 */

var  MongoClient = require('mongodb').MongoClient
    , Server = require('mongodb').Server
    , thief = require('node-color-thief')
    , fs = require('fs')
    , path = require('path')
    , mongo = require('./mongoprovider')
    , appRunDirname = require('path').dirname(require.main.filename)
    , q = require('q')
    , db;

var mongoClient = new MongoClient(new Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {
  db = mongoClient.db('rijks');
});

exports.getPalette = function(req, res) {
  var imageId, colorCount;

  imageId = req.params.id.toLowerCase();

  //colorCount = (req.query.colorCount || 5);
  //limit to only 5 colors for now
  colorCount = 5;

  //Check if the palette is already cached
  db.collection('palettes').find({work_id: imageId }).toArray(function(err, workPalette) {
    if (!err && workPalette.length > 0) {
      console.log('palette cached...');
      res.jsonp(workPalette);
    }
    else {
      //Palette not cached, lets get create it
      doGetPalette(imageId, colorCount)
        .then(function(p) {
          res.jsonp(p);
        }, function(error) {
          console.log(error);
        });
    }
  });
};

exports.getDominantColor = function(req, res) {
  var imageId, colorCount;

  imageId = req.params.id.toLowerCase();
  colorCount = 5;

  db.collection('palettes').find({work_id: imageId }).toArray(function(err, work) {
    if (!err && work.length > 0) {
      console.log('d-palette cached...');
      res.jsonp(work[0].palette[0]);
    }
    else {
      //Palette not cached, lets get create it
      doGetPalette(imageId, colorCount)
        .then(function(p) {
          var obj = {
            work_id: imageId,
            palette: p[0].palette[0]
          };
          res.jsonp(obj);
        }, function(error) {
          console.log(error);
        });
    }
  });
};

var doGetPalette = function(imageId, colorCount) {
  var cachedImgFilename, _palette, deferred;

  deferred = q.defer();
  cachedImgFilename  = path.resolve(appRunDirname, 'image-cache', imageId + ".jpeg");

  fs.stat(cachedImgFilename, function(err, stat) {
    if (!err) {
      _palette = thief.createPalette(cachedImgFilename, colorCount);
      if (_palette.length > 0) {
        cachePalette(imageId, _palette)
          .then(function(record) {
            deferred.resolve(record);
          });

      }
    }
    else {
      deferred.reject(new Error(err));
    }
  });
  return deferred.promise;
};

var cachePalette = function(imageId, _palette) {
  var deferred = q.defer();

  var document = {
    work_id: imageId
    , palette: _palette
    , lud_dtm: Date.now()
  };

  db.collection('palettes').insert(document, {safe: true}, function(err, records) {
    console.log('**********\nRecord Added as ', records[0]);
    deferred.resolve(records[0]);
  });

  return deferred.promise;
};