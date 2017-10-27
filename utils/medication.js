var config = require('../config.js');
var nano = require('nano')(config.couchAuthDbURL);

var maindb = nano.use('main');
var views = ['inventory_by_friendly_id', 'inventory_by_name'];
var updatedDocs = 0;
var errDocs = 0;

views.map(function(view){
  processDocuments(view);
});

console.log('Util updated %s documents', updatedDocs);
if (errDocs !== 0) {
  console.log('%s documents not updated.', errDocs);
}

function processDocuments(viewName) {
  maindb.view(viewName, viewName, { include_docs: true }, function(err, body){
    if (!err) {
      body.rows.map((doc)=>{
        let item = doc.doc.data;
        if (item.inventoryType == 'medicine' || item.inventoryType == 'medication') {
          item.inventoryType = 'Medication';
          updateDocument(doc.doc, viewName, function(res){
            console.log(res);
          });
        }
      });
    } else {
      console.log('Not connected to couchdb.');
    }
  });
}

function updateDocument(doc, viewName, callback){
  maindb.insert(doc, doc._id, function(error, response){
    if (error) {
      errDocs += 1;
      callback(error);
    } else {
      updatedDocs += 1;
      callback(response);
    }
  });
}
