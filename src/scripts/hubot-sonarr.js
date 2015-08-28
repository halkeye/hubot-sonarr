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
//   !searchTV <query> - Searches sonarrs sources to find information about a tv show 
//   !tonightTV - Reports what should download in the upcoming day
//
// Notes:
//   Copyright (c) 2015 Gavin Mogan
//   Licensed under the MIT license.
//
// Author:
//   halkeye

"use strict";
var sonarr = require("./sonarr.js");
var util = require("util");

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
  robot.parseHelp(__filename);
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

  robot.hear(/^!searchTV (.*)/i, function (res) {
    sonarr.fetchFromSonarr(
      sonarr.apiURL("series/lookup", { term: res.match[1] })
    ).then(function (body) {
      if (body.length === 0) {
        res.send("No results found for [" + res.match[1] + "]");
      }
      var shows = body.map(function (show) {
        var uuid = show.titleSlug;
        robot.brain.set("searchTV_show_" + uuid, show);
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

    res.send("OK");

    if (data.Message) {
      robot.messageRoom(
        room,
        "Now " + data.EventType + "ed: " + data.Message
      );
      return;
    }


    var episodeList = [];
    if (data.Episodes) {
      episodeList = data.Episodes.map(function (episode) {
        var str = "S" + ("00" + episode.SeasonNumber).slice(-2) +
          "E" + ("00" + episode.EpisodeNumber).slice(-2) +
          " - " + episode.Title;
        if (episode.Quality) {
          str += " [" + episode.Quality + "]";
        }
        return str;
      });
    }

    var output = "Now " + data.EventType + "ing " + data.Series.Title;
    if (episodeList.length) {
      output += ": ";
      output += episodeList.join(", ");
    }

    robot.messageRoom(room, output);

  });
};
