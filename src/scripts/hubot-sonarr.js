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

'use strict';
var sonarr = require('./sonarr.js');

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
  robot.sonarr = sonarr;
  robot.hear(/^!tonightTV/i, function (res) {
    robot.sonarr.fetchFromSonarr(robot.sonarr.apiURL('calendar'))
      .then(function (body) {
        var shows = body.map(function (show) {
          return show.series.title + ' - ' + show.title;
        });
        res.send('Upcoming shows:\n' + shows.join(',\n '));
      }).catch(function (ex) {
        console.log('catch');
        res.send('Encountered an error :( ' + ex);
      });
  });

  robot.hear(/^!searchTV (.*)/i, function (res) {
    robot.sonarr.fetchFromSonarr(
      robot.sonarr.apiURL('series/lookup', { term: res.match[1] })
    ).then(function (body) {
      if (body.length === 0) {
        res.send('No results found for [' + res.match[1] + ']');
        return;
      }
      var shows = body.map(function (show) {
        var uuid = show.titleSlug;
        robot.brain.set('searchTV_show_' + uuid, show);
        return [
          uuid + ')',
          show.title,
          '-',
          'http://www.imdb.com/title/' + show.imdbId,
          '-',
          'http://thetvdb.com/?tab=series&id=' + show.tvdbId
        ].join(' ');
      });
      res.send('Results for [' + res.match[1] + ']:\n' + shows.join(', \n'));
    }).catch(function (ex) {
      res.send('Encountered an error :( ' + ex);
    });
  });

  robot.router.post('/hubot/sonarr/:room', function (req, res) {
    var data = req.body;

    res.send('OK');

    var rooms = [req.params.room || req.query.room];

    if (data.Message) {
      rooms.forEach(function (room) {
        robot.messageRoom(
          room,
          'Now ' + data.EventType + 'ed: ' + data.Message
        );
      });
      return;
    }

    if (req.query.multiRoom) {
      if (data && data.Series && data.Series.Title) {
        rooms.push(data.Series.Title.toLowerCase().replace(/\W+/g, '_').substring(0, 21));
      }
    }
    rooms.forEach(function (room) {
      var episodeList = [];
      if (data.Episodes) {
        episodeList = data.Episodes.map(function (episode) {
          var str = 'S' + ('00' + episode.SeasonNumber).slice(-2) +
            'E' + ('00' + episode.EpisodeNumber).slice(-2) +
            ' - ' + episode.Title;
          if (episode.Quality) {
            str += ' [' + episode.Quality + ']';
          }
          return str;
        });
      }

      var output = 'Now ' + data.EventType + 'ing ' + data.Series.Title;
      if (episodeList.length) {
        output += ': ';
        output += episodeList.join(', ');
      }

      try {
        robot.messageRoom(room, output);
      } catch (e) {
        if (e instanceof TypeError) {
          robot.messageRoom(req.query.adminChannel, 'Unable to post to ' + room);
          // probably can't send to non existing room
        }
        throw e;
      }
    });
  });
};
