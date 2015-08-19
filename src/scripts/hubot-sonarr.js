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
var sonarr = require('./sonarr.js');

module.exports = function(robot) {
  robot.hear(/!tonightTV/i, function(res) {
    sonarr.fetchFromSonarr(sonarr.apiURL('calendar')).then(function(body) {
      var shows = body.map(function(show) {
        return show.series.title + ' - ' + show.title;
      })
      res.send("Upcoming shows: " + shows.join(",\n "));
    }).catch(function(ex) {
      res.send("Encountered an error :( " + ex);
    });;
  });

  robot.router.post('/hubot/sonarr/:room', function(req, res) {
    room = req.params.room || req.query.room;
    data = req.body

    robot.messageRoom(room, JSON.stringify({ body: req.body, params: req.params, query: req.query }))

    res.send('OK')
  });
};
