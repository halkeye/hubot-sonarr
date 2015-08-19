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

var sonarr = require('../scripts/sonarr.js');

/*
 * This needs to be moved into testing fetchFromSonarr
 * mockRequest(url, __dirname + '/http_responses/calendar_nothing.json');
 */
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

describe('hubot_sonarr', function() {
  describe('!tonightTV', function() {
    var url = '/api/calendar';
    describe('single response', function(done) {
      before(function() {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns( Promise.resolve([]));
        robot.adapter.send = sinon.spy()

        send_message('!tonightTV');
      });
      it('output title', function() {
        robot.adapter.send.args.should.be.empty
        this.mock.verify();
      });
    });
    describe('single response', function(done) {
      before(function() {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(
          Promise.resolve(require(__dirname + '/http_responses/calendar_single_series.json'))
        );
        robot.adapter.send = sinon.spy()
        send_message('!tonightTV');
      });
      it('output title', function() {
        robot.adapter.send.args.should.not.be.empty
        robot.adapter.send.args[0][1].should.eql("Upcoming shows:\nBob's Burgers - Easy Com-mercial, Easy Go-mercial")
      });
    });
    describe('multiple response', function(done) {
      before(function() {
        this.mock.expects("fetchFromSonarr").once().returns(
          Promise.resolve(require(__dirname + '/http_responses/calendar_multiple_series.json'))
        );
        robot.adapter.send = sinon.spy()
        send_message('!tonightTV');
      });
      it('output title', function() {
        robot.adapter.send.args.should.not.be.empty
        robot.adapter.send.args[0][1].should.eql("Upcoming shows:\nExtant - The Other Side,\n Mr. Robot - eps1.8_m1rr0r1ng.qt,\n Why? With Hannibal Buress - Episode 7")
      });
    });
  });
});
