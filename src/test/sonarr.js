/* 'use strict'

process.env.HUBOT_SONARR_HTTP = process.env.HUBOT_SONARR_HTTP || 'http://sonarr/';
process.env.HUBOT_SONARR_API_KEY = process.env.HUBOT_SONARR_API_KEY || '12345-12345-1234';
process.env.EXPRESS_PORT = process.env.PORT = 0;

var sinon = require('sinon');
var should = require('should');
var nock = require('nock');
//nock.recorder.rec();

var send_message = function(msg) {
  var user = robot.brain.userForId('1', { name: 'Shell', room: 'Shell' });
  robot.adapter.receive(new TextMessage(user, msg, 'messageId'));
}

var sonarr = require('../scripts/sonarr.js');

// mockRequest(url, __dirname + '/http_responses/calendar_nothing.json');
var mockRequest = function(url, file) {
  return nock(process.env.HUBOT_SONARR_HTTP)
    .get('/api/calendar')
    .reply(
      200,
      require(file),
      {
        server: 'nginx/1.6.3',
        date: 'Tue, 18 Aug 2015 17:31:21 GMT',
        'content-type': 'application/json; charset=utf-8',
        'transfer-encoding': 'chunked',
        connection: 'close',
        'x-applicationversion': '2.0.0.3357',
        'cache-control': 'no-cache, no-store, must-revalidate',
        pragma: 'no-cache',
        expires: '0',
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, OPTIONS, PATCH, POST, PUT, DELETE'
      }
    );
};

*/
