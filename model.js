const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const URLGeneratorSchema = new Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: String,
    required: true
  }
});

const URLGenerator = mongoose.model('URLGenerator', URLGeneratorSchema);

const NextAvailableShortURLSchema = new Schema({
  nextShortURL: {
    type: Number,
    min: 1,
    required: true
  }
});

const init = function() {
  NextAvailableShortURL.findOne({}, function(err, availableShortURL) {
    if (err) {
      console.error(err);
    } else if (availableShortURL === null) {
      // initShortURL = new NextAvailableShortURL({ nextShortURL: 1 });
      new NextAvailableShortURL({ nextShortURL: 1 }).save(function(err, initializedShortURL) {
        if (err) {
          console.error(err);
        } else {
          console.log('initialized available short url: ', initializedShortURL.nextShortURL);
        }
      });
    }
  });
}

const NextAvailableShortURL = mongoose.model('NextAvailableShortURL', NextAvailableShortURLSchema);

const model = (function() {
  const INTERNAL_ERR_MSG = 'Internal server error';

  const _errResponse = function(err, message, cb) {
    console.error(err);
    return cb({ error: message });
  };

  const _getNextAvailableShortURL = function(cb) {
    NextAvailableShortURL.findOneAndUpdate({}, { $inc: { nextShortURL: 1 } }, cb);
  };

  const _createNewURLObject = function(originalURL, shortURL, cb) {
    URLGenerator.create({ original_url: originalURL, short_url: shortURL }, cb);
  };
  const generateURLObject = function(originalURL, cb) {
    // check if url already in database
    URLGenerator.findOne({ original_url: originalURL }, function(err, record) {
      if (err) return _errResponse(err, INTERNAL_ERR_MSG, cb);

      if (record) {
        const publicRec = Object.assign({}, { original_url: record.original_url, short_url: record.short_url });
        return cb(publicRec);
      }

      // generate new url object if it doesn't exist already
      // -- take next available short url
      _getNextAvailableShortURL(function (err, recShort) {
        if (err) return _errResponse(err, INTERNAL_ERR_MSG, cb);

        _createNewURLObject(originalURL, recShort.nextShortURL, function (err, recURLs) {
          if (err) return _errResponse(err, INTERNAL_ERR_MSG, cb);
          
          const publicURLObject = Object.assign({}, { original_url: recURLs.original_url, short_url: recURLs.short_url });
          cb(publicURLObject);
        });
      });
    });
  };

  const getURLObject = function(shortURL, cb) {
    URLGenerator.findOne({ short_url: shortURL }, function(err, record) {
      if (err) return _errResponse(err, INTERNAL_ERR_MSG, cb);

      if (record) {
        const temp_url = `http://${record.original_url}`;
        return cb(temp_url);
      }

      console.log(record);
      return cb({ error: 'No such short URL' });
    });
  };

  return {
    generateURLObject,
    getURLObject
  }
})();

// initialize if neccessary
init();

module.exports = model;