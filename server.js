'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const model = require('./model');
const dns = require('dns');

var bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });


var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;
const MONGO_USER = 'xuanhoan';
const MONGO_PASS = 'hoan123456';
const MONGO_URL = "mongodb://"+MONGO_USER +":"+MONGO_PASS+"@ds151853.mlab.com:51853/url-shortener-micro";


/** this project needs a db !! **/ 
mongoose.Promise = global.Promise;
const mongoOptions = { useMongoClient: true };
mongoose.connect(MONGO_URL, mongoOptions)
  .then(function() {
    console.log('connected to database url-shortener');
  })
  .catch(function(error) {
    console.error(error.message);
    //process.exit(1);
});

app.use(cors());
app.use(jsonParser);
app.use(urlencodedParser);

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});
app.post("/api/shorturl/new", function (req, res) {
  let inputURL = req.body.url;
  //console.log(inputURL );
  //https -> http
  const _removeProtocolFromURL = function(url) {
        if (url[4] == 's') return url.substr(8);
        return url.substr(7);
      }

      const host = _removeProtocolFromURL(inputURL);
      dns.lookup(host, function(err, address) { 
        
        if (err) {
          res.send({ error: 'Invalid URL' });
        } else {
          // console.log(host);
          model.generateURLObject(host, function(URLObject) {
            res.send(URLObject);
          });        
        }
      });
});
app.get("/api/shorturl/:shortURL", function (req, res) {
     const inputURL = req.params.shortURL;
      model.getURLObject(inputURL, function(originalURL) {
        if (typeof originalURL === 'object') return res.send(originalURL);
        res.redirect(originalURL);
      });
});





app.listen(port, function () {
  console.log('Node.js listening ...');
});