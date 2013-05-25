/**
 * Created with JetBrains WebStorm.
 * User: Miguel Bermudez
 * Date: 5/25/13
 * Time: 12:57 AM
 */

var thief = require('node-color-thief')
    , fs = require('fs')
    , path = require('path')
    , appRunDirname = require('path').dirname(require.main.filename);

exports.getPalette = function(req, res) {
  var imageId, cachedImgFilename, palette, colorCount;

  colorCount = 5;
  imageId = req.params.id;

  cachedImgFilename  = path.resolve(appRunDirname, 'image-cache', imageId + ".jpeg");
  console.log(cachedImgFilename);
  fs.stat(cachedImgFilename, function(err, stat) {
    if (!err) {
      res.setHeader('Last-Modified', stat.mtime);
      palette = thief.createPalette(cachedImgFilename, colorCount);
      res.jsonp(palette);
    }
    else {
      //Return nothing if no cached image is found, for now ....
      res.jsonp([]);
    }
  })
};

exports.getDominantColor = function(req, res) {
  var imageId, cachedImgFilename, dColor;

  imageId = req.params.id;
  cachedImgFilename  = path.resolve(appRunDirname, 'image-cache', imageId + ".jpeg");

  fs.stat(cachedImgFilename, function(err, stat) {
    if (!err) {
      res.setHeader('Last-Modified', stat.mtime);
      dColor = thief.getDominantColor(cachedImgFilename);
      res.jsonp(dColor);
    }
    else {
      //Return nothing if no cached image is found, for now ....
      res.jsonp([]);
    }
  })
};

