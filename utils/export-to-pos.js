var config = require('../config.js');
var nano = require('nano')(config.couchAuthDbURL);
var mysql = require('mysql')
var connection = mysql.createConnection({
  host: '192.168.0.166',
  port: '3306',
  user: 'root',
  password: '',
  database: 'pos'
});

var maindb = nano.use('main');
var views = ['inventory_purchase_by_date_received'];
let itemsMap = [];
let purchaseMap = [];
let inventoryMap = [];

views.map(function(view){
  maindb.view(view, view, { include_docs: true }, function(error, body){
    if (!error) {
      body.rows.map(function(doc){
        let purchase = doc.doc.data;
        if (purchase.inventoryItem !== null) {
          purchaseMap.push(purchase);
        }
      });
      parseItems();
    } else {
      console.error('Error connnecting to couchdb....', error);
    }
  });
});

function parseItems(){
  purchaseMap.forEach(function(item){
    maindb.get(item.inventoryItem,  function(error, itemDetails){
      if (!error) {
        itemsMap.push(itemDetails)
      } else {
        console.log('%s, %s is %s', error.name, item.inventoryItem, error.reason);
      }
    });
  })
}


function logInfo() {
  console.log('Purchased items:: ', purchaseMap.length);
  console.log('Items map :: ', itemsMap.length);
}

setTimeout(function(){
  logInfo();
  convertToPosSchema()
}, 10000);

function convertToPosSchema() {
  purchaseMap.forEach(function(purchase){
    itemsMap.forEach(function(item){
      if (purchase.inventoryItem == item._id) {
        let price = purchase.purchaseCost
        if (item.data.price !== null) {
          price = item.data.price;
        }
        let data = {
          "code": item.data.friendlyId,
          "couchId": item._id,
          "name": item.data.name,
          "altname": item.data.name,
          "description": item.data.distributionUnit,
          "taxid": 3,
          "price": price,
          "cost": purchase.purchaseCost,
          "type": 1,
          "supplierid": 1,
          "categoryid": 1,
          "modifiers": []
        };
        let insertQuery = "INSERT INTO `stored_items` (`data`, `supplierid`, `categoryid`, `code`, `name`, `price`) VALUES( '" + JSON.stringify(data) + "', 1, 1, '" + item.data.friendlyId + "', '" + item.data.name + "',  " + price + " )";
        connection.query(insertQuery, function(error, results, fields){
          if (error) {
            console.log('error', error);
          }
        });
        // console.log(schema);
      }
    });
  });
  // connection.close();
}
