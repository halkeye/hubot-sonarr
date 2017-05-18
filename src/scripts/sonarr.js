'use strict';
var Path = require('path');
var Url = require('url');
var QS = require('qs');
var request = require('request');
require('es6-promise').polyfill();

module.exports = {
  apiURL: function apiUrl (uri, params) {
    var str = Url.resolve(process.env.HUBOT_SONARR_HTTP, Path.join('api', uri));
    if (params) {
      str = str + '?' + QS.stringify(params);
    }
    return str;
  },
  fetchFromSonarr: function fetchFromSonarr (url) {
    return new Promise(function (resolve, reject) {
      var options = {
        url: url,
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': process.env.HUBOT_SONARR_API_KEY
        }
      };
      request.get(options, function (err, httpres, body) {
        if (err) { return reject(err); }
        if (httpres.statusCode !== 200) { return reject(new Error('Error Code: ' + httpres.statusCode)); }
        return resolve(JSON.parse(body));
      });
    });
  }
};
