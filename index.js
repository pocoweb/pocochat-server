// Example express application adding the parse-server module to expose Parse
// compatible API routes.
require('dotenv').config();

console.log(process.env);

var express = require('express');
var oauthshim = require('oauth-shim');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',

  appId: process.env.APPLICATION_ID || 'pocoweb-chat',
  masterKey: process.env.REST_API_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Messages", "Posts", "Comments"], // List of classes to support for query subscriptions
    //redisURL: 'redis://127.0.0.1:6379'  // to go with LiveQueryServer
  },

  websocketTimeout: 10 * 1000,
  cacheTimeout: 60 * 600 * 1000,
  logLevel: 'VERBOSE',

});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

app.all('/oauthproxy', oauthshim);
 
// Initiate the shim with Client ID's and secret, e.g. 
oauthshim.init([{
  // id : secret 
  client_id: '90b3f6ed4f34d5c8d1cf',
  client_secret: 'addbad5b3f5b9def6607e3872f56d366cf16cdde',
  // Define the grant_url where to exchange Authorisation codes for tokens 
  grant_url: 'https://github.com/login/oauth/access_token',
  // Restrict the callback URL to a delimited list of callback paths 
  domain: 'localhost:8080, localhost:1337'
}
]);


var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer, {
    //redisURL: 'redis://127.0.0.1:6379'  // to go with LiveQueryServer
});
