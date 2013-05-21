/**
 * Created with JetBrains WebStorm.
 * User: Miguel Bermudez
 * Date: 5/21/13
 * Time: 1:51 AM
 * To change this template use File | Settings | File Templates.
 */

var MongoClient = require('mongodb').MongoClient,
  Server = require('mongodb').Server,
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
  skip = parseInt(req.params.skip) || 0;
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

