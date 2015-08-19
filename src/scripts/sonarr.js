'use strict';
var Path = require('path');
var Url = require('url');
var request = require('request');

module.exports = {
  apiURL: function apiUrl(uri) {
    return Url.resolve(process.env.HUBOT_SONARR_HTTP,Path.join('api', uri));
  },
  fetchFromSonarr: function fetchFromSonarr(url) {
    return new Promise(function (resolve, reject) {
      var options = {
        url: url,
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': process.env.HUBOT_SONARR_API_KEY
        }
      };
      request.get(options, function (err,httpres,body) {
        if (err) { return reject(err); }
        if (httpres.statusCode !== 200) { return reject("Error Code: " + httpres.statusCode); }
        return resolve(JSON.parse(body));;
      });
    });
  }
};
