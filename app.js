var config =  require('./config.js');
var dbListeners = require('hospitalrun-dblisteners');
var express = require('express');
var fs = require('fs');
var https = require('https');
var http = require('http');
var morgan = require('morgan');
var serverRoutes = require('hospitalrun-server-routes');
var setupAppDir = require('hospitalrun');
var mysql = require('mysql');
var xmlParser = require('xml-js');
var jsonParser = require('jsontoxml');
var bodyParser = require('body-parser');
var server;
var connection = mysql.createConnection({
  host: config.mysqlServer,
  port: config.mysqlPort,
  user: config.mysqlAdminUser,
  password: config.mysqlAdminPassword,
  database: config.mysqlDatabase
});

dbListeners(config);
var app = express();
if (config.useSSL && config.useCertBot === true) {
  app.use('/.well-known', express.static(__dirname + '/public/.well-known', {dotfiles: 'allow'}));
  http.createServer(app).listen(80);
}
serverRoutes(app, config);
setupAppDir(app);
if (config.logRequests) {
  app.use(morgan(config.logFormat));
}
app.use('/patientimages', express.static(config.imagesdir));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

connection.connect();
app.get('/api/v1/smart/:id', (req, res, next)=>{
  var patientID = req.params['id'];
  var query = 'SELECT * FROM exchange_files WHERE Member_Nr =\'' + patientID + '\' ORDER BY ID DESC LIMIT 1';
  connection.query(query, (error, results, fields)=>{
    if (error) {
      console.log('Error quering smart, ', error);
    } else {
      if (results.length < 1) {
        res.send('Patient not found.');
      } else {
        var progressFlag = results[0].Progress_Flag;
        var fileBuffer = new Buffer(results[0].Smart_File, 'binary');
        var xmlData = fileBuffer.toString('utf8');
        var jsonFile = xmlParser.xml2js(xmlData, config.parserOptions);
        if (progressFlag !== 1) {
          res.json(progressFlag);
        } else {
          res.json(jsonFile);
        }
      }
    }
  });
});

app.put('/api/v1/smart/:id', (req, res, next)=>{
  var id = req.params['id'];
  var date = new Date();
  var smartDate = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay() + '\ ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
  var claimJson = req.body;
  var claimXml = jsonParser(claimJson.claim);
  var query = 'SELECT Progress_Flag  FROM exchange_files WHERE Member_Nr=\'' + id + '\' ORDER BY ID DESC LIMIT 1';
  connection.query(query, (error, results, fields)=>{
    if (results[0].Progress_Flag == 2) {
      res.json({ 'flag': 2 });
    } else {
      query = 'UPDATE exchange_files SET Exchange_Date =\'' + smartDate + '\', Progress_Flag = 2, Exchange_File =\'' + claimXml + '\' WHERE Member_Nr=\'' + id + '\' ORDER BY ID DESC LIMIT 1';
      connection.query(query, (error, results, fields)=>{
        if (error) {
          res.json({ 'flag': 3, 'error': error.message });
        } else {
          res.json({ 'flag': 0 });
        }
      });
    }
  });

});

if (config.useSSL) {
  var options = {
    key: fs.readFileSync(config.sslKey),
    cert: fs.readFileSync(config.sslCert),
  };
  if (config.sslCA) {
    options.ca = [];
    config.sslCA.forEach(function(caFile) {
      options.ca.push(fs.readFileSync(caFile));
    });
  }
  server = https.createServer(options, app);
} else {
  server = http.createServer(app);
}

server.listen(config.serverPort, function listening() {
  console.log('HospitalRun server listening on %j', server.address());
});
