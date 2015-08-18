'use strict'

process.env.HUBOT_SONARR_HTTP = process.env.HUBOT_SONARR_HTTP || 'http://sonarr/';
process.env.HUBOT_SONARR_API_KEY = process.env.HUBOT_SONARR_API_KEY || '12345-12345-1234';
process.env.EXPRESS_PORT = process.env.PORT = 0;

require('coffee-script/register');
var Hubot = require('hubot');
var Path = require('path');
var Url = require('url');
var sinon = require('sinon');
var should = require('should');
var nock = require('nock');
//nock.recorder.rec();

var adapterPath = Path.join(Path.dirname(require.resolve('hubot')), "src", "adapters");
var robot = Hubot.loadBot(adapterPath, "shell", "true", "MochaHubot");
var TextMessage = require(Path.join(adapterPath,'../message')).TextMessage;

var hubot_url_describer = require('../scripts/hubot-sonarr')(robot);

var send_message = function(msg) {
  var user = robot.brain.userForId('1', { name: 'Shell', room: 'Shell' });
  robot.adapter.receive(new TextMessage(user, msg, 'messageId'));
}

nock(process.env.HUBOT_SONARR_HTTP)
  .get('/api/calendar')
  .reply(
    200,
    require(__dirname + '/http_responses/calendar_single_series.json'),
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


describe('hubot_sonarr', function() {
  describe('!tonightTV', function() {
    before(function(done) {
/*      var n = nock(process.env.HUBOT_SONARR_HTTP)
        .log(console.log)
        .defaultReplyHeaders({'Content-Type': 'application/json; charset=utf-8'})
        .get('/api/calendar')
        .reply(200, require(__dirname + '/http_responses/calendar_single_series.json'))
      console.log(n);*/
      robot.adapter.send = sinon.spy()
      send_message('!tonightTV');
      // hack to wait for robot to finish fetching and returning
      setTimeout(done, 100);
    });
    describe('has responses', function(done) {
      it('output title', function() {
        robot.adapter.send.args.should.not.be.empty
        //if (!robot.adapter.send.args[0]) return
        robot.adapter.send.args[0][1].should.eql("Upcoming shows: Bob's Burgers - Easy Com-mercial, Easy Go-mercial")
      });
    });
  });
});
