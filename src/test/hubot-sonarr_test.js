'use strict'

process.env.HUBOT_SONARR_HTTP = process.env.HUBOT_SONARR_HTTP || 'http://sonarr/';
process.env.HUBOT_SONARR_API_KEY = process.env.HUBOT_SONARR_API_KEY || '12345-12345-1234';
process.env.EXPRESS_PORT = process.env.PORT = 0;

require('coffee-script/register');
var Hubot = require('hubot');
var Path = require('path');
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

describe('hubot_sonarr', function() {
  describe('!tonightTV', function() {
    describe('failure', function(done) {
      before(function(done) {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns( Promise.reject("Error 500"));
        robot.adapter.send = sinon.spy()

        send_message('!tonightTV');
        done();
      });
      it('output title', function() {
        robot.adapter.send.args.should.not.be.empty
        robot.adapter.send.args[0][1].should.eql("Encountered an error :( Error 500")
        this.mock.verify();
      });
    });
    describe('empty response', function(done) {
      before(function(done) {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns( Promise.resolve([]));
        robot.adapter.send = sinon.spy()

        send_message('!tonightTV');
        done();
      });
      it('output title', function() {
        robot.adapter.send.args.should.be.empty
        this.mock.verify();
      });
    });
    describe('single response', function(done) {
      before(function(done) {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(
          Promise.resolve(require(__dirname + '/http_responses/calendar_single_series.json'))
        );
        robot.adapter.send = sinon.spy()
        send_message('!tonightTV');
        done();
      });
      it('output title', function() {
        robot.adapter.send.args.should.not.be.empty
        robot.adapter.send.args[0][1].should.eql("Upcoming shows:\nBob's Burgers - Easy Com-mercial, Easy Go-mercial")
        this.mock.verify();
      });
    });
    describe('multiple response', function(done) {
      before(function(done) {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(
          Promise.resolve(require(__dirname + '/http_responses/calendar_multiple_series.json'))
        );
        robot.adapter.send = sinon.spy()
        send_message('!tonightTV');
        done();
      });
      it('output title', function() {
        robot.adapter.send.args.should.not.be.empty
        robot.adapter.send.args[0][1].should.eql("Upcoming shows:\nExtant - The Other Side,\n Mr. Robot - eps1.8_m1rr0r1ng.qt,\n Why? With Hannibal Buress - Episode 7")
        this.mock.verify();
      });
    });
  });
});
