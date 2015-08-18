// Description:
//   Sonarr Integration
//
// Dependencies:
//   None
//
// Configuration:
//   HUBOT_SONARR_HTTP - Sonarr's base url
//   HUBOT_SONARR_API_KEY - key key key
//
// Commands:
//   None
//
// Notes:
//   Copyright (c) 2015 Gavin Mogan
//   Licensed under the MIT license.
//
// Author:
//   halkeye

'use strict'
var Path = require('path');
var Url = require('url');
var request = require('request');

var apiURL = function(uri) {
  return Url.resolve(process.env.HUBOT_SONARR_HTTP,Path.join('api', uri));
}

module.exports = function(robot) {
  robot.hear(/!tonightTV/i, function(res) {
    var options = {
      url: apiURL('calendar'),
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': process.env.HUBOT_SONARR_API_KEY
      }
    };
    request.get(options, function (err,httpres,body) {
      if (err) {
        res.send("Encountered an error :( " + err);
        return
      }
      if (httpres.statusCode !== 200) {
        res.send("Request didn't come back HTTP 200 (" + httpres.statusCode + "):(");
        return;
      }
      var shows = JSON.parse(body).map(function(show) {
        return show.series.title + ' - ' + show.title;
      })
      res.send("Upcoming shows: " + shows.join(', '));
    });
  });

  robot.router.post('/hubot/sonarr/:room', function(req, res) {
    room = req.params.room || req.query.room;
    data = req.body

    robot.messageRoom(room, JSON.stringify({ body: req.body, params: req.params, query: req.query }))

    res.send('OK')
  });
};
