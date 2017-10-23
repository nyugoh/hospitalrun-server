var config = {
  couchDbServer: 'localhost',
  couchDbPort: '5984',
  couchDbUseSsl: false,
  couchDbChangesSince: 'now',
  couchAdminUser: 'couchadmin',
  couchAdminPassword: 'test',
  googleClientId: 'FOR GOOGLE SSO; GOOGLE CLIENT ID GOES HERE',
  googleClientSecret: 'FOR GOOGLE SSO; GOOGLE CLIENT SECRET GOES HERE',
  serverPort: '3000',
  server: 'localhost',
  sslCert: 'file location of ssl cert if needed',
  sslKey: 'file location of ssl key if needed',
  sslCA: [], // Array of file locations of trusted certificates in PEM format if needed
  useSSL: false,
  imagesdir: __dirname + '/patientimages',
  attachmentsDir: __dirname + '/attachments',
  logRequests: false,
  logFormat: 'default', // See http://www.senchalabs.org/connect/logger.html for log formats
  useGoogleAuth: false,
  useCertBot: false
};

config.couchCredentials = function() {
  if (config.couchAdminUser && config.couchAdminPassword) {
    return config.couchAdminUser + ':' + config.couchAdminPassword + '@';
  } else {
    return '';
  }
};

config.getProtocol = function(isSSL) {
  return 'http' + (isSSL ? 's' : '') + '://';
};

config.serverURL = config.getProtocol(config.useSSL) + config.server;
if (config.serverPort) {
  config.serverURL += ':' + config.serverPort;
}

config.couchDbURL = config.getProtocol(config.couchDbUseSsl) + config.couchDbServer + ':' + config.couchDbPort;
config.couchAuthDbURL = config.getProtocol(config.couchDbUseSsl) + config.couchCredentials() + config.couchDbServer + ':' + config.couchDbPort;
config.searchURL = 'http://elastic:changeme@localhost:9200'; // ELASTIC SEARCH URL
config.webDir = __dirname + '/public';
config.serverInfo = 'HospitaliPlus is a Modern Application for Hospital Management focused on working offline first.';
module.exports = config;
