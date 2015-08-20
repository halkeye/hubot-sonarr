// Description:
//   Sonarr Integration
//
// Dependencies:
//   None
//
// Configuration:
//   HUBOT_SONARR_HTTP - Sonarr"s base url
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

"use strict";
var sonarr = require("./sonarr.js");


/*
 * commands
 * !animeAdd Showname
 *    Returns items with guids
 * !animeAdd <integer> [<quality]
 * !tvAdd Showname
 *    Returns items with guids
 * !tvAdd <integer> [<quality]
 */

module.exports = function (robot) {
  robot.hear(/^!tonightTV/i, function (res) {
    sonarr.fetchFromSonarr(sonarr.apiURL("calendar")).then(function (body) {
      var shows = body.map(function (show) {
        return show.series.title + " - " + show.title;
      });
      res.send("Upcoming shows:\n" + shows.join(",\n "));
    }).catch(function (ex) {
      res.send("Encountered an error :( " + ex);
    });
  });

  robot.hear(/^!addTV (.*)/i, function (res) {
    sonarr.fetchFromSonarr(
      sonarr.apiURL("series/lookup", { term: res.match[1] })
    ).then(function (body) {
      if (body.length === 0) {
        res.send("No results found for [" + res.match[1] + "]");
      }
      var shows = body.map(function (show) {
        var uuid = show.titleSlug;
        robot.brain.set("addTV_show_" + uuid, show);
        return [
          uuid + ")",
          show.title,
          "-",
          "http://www.imdb.com/title/" + show.imdbId,
          "-",
          "http://thetvdb.com/?tab=series&id=" + show.tvdbId
        ].join(" ");
      });
      res.send("Results for [" + res.match[1] + "]:\n" + shows.join(", \n"));
    }).catch(function (ex) {
      res.send("Encountered an error :( " + ex);
    });
  });

  robot.router.post("/hubot/sonarr/:room", function (req, res) {
    var room = req.params.room || req.query.room;
    var data = req.body;

    robot.messageRoom(
      room,
      JSON.stringify({
        body: req.body,
        params: req.params,
        query: req.query
      })
    );

    res.send("OK");
  });
};
