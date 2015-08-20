//eslint-disable no-unused-expressions
//eslint-disable max-nested-callbacks
"use strict";

process.env.HUBOT_SONARR_HTTP = process.env.HUBOT_SONARR_HTTP || "http://sonarr/";
process.env.HUBOT_SONARR_API_KEY = process.env.HUBOT_SONARR_API_KEY || "12345-12345-1234";
process.env.EXPRESS_PORT = process.env.PORT = 0;

require("coffee-script/register");
var Hubot = require("hubot");
var Path = require("path");
var sinon = require("sinon");
require("should");

var adapterPath = Path.join(Path.dirname(require.resolve("hubot")), "src", "adapters");
var robot = Hubot.loadBot(adapterPath, "shell", "true", "MochaHubot");
var TextMessage = require(Path.join(adapterPath, "../message")).TextMessage;

require("../scripts/hubot-sonarr")(robot);

var send_message = function (msg) {
  var user = robot.brain.userForId("1", { name: "Shell", room: "Shell" });
  robot.adapter.receive(new TextMessage(user, msg, "messageId"));
};

var sonarr = require("../scripts/sonarr.js");

describe("hubot_sonarr", function () {
  describe("!tonightTV", function () {
    describe("failure", function () {
      before(function () {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(Promise.reject("Error 500"));
        robot.adapter.send = sinon.spy();

        send_message("!tonightTV");
      });
      it("output title", function () {
        robot.adapter.send.args.should.not.be.empty;
        robot.adapter.send.args[0][1].should.eql("Encountered an error :( Error 500");
        this.mock.verify();
      });
    });
    describe("empty response", function () {
      before(function () {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(Promise.resolve([]));
        robot.adapter.send = sinon.spy();

        send_message("!tonightTV");
      });
      it("output title", function () {
        robot.adapter.send.args.should.be.empty;
        this.mock.verify();
      });
    });
    describe("single response", function () {
      before(function () {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(
          Promise.resolve(require(__dirname + "/http_responses/calendar_single_series.json"))
        );
        robot.adapter.send = sinon.spy();
        send_message("!tonightTV");
      });
      it("output title", function () {
        robot.adapter.send.args.should.not.be.empty;
        robot.adapter.send.args[0][1].should.eql(
          "Upcoming shows:\nBob's Burgers - Easy Com-mercial, Easy Go-mercial"
        );
        this.mock.verify();
      });
    });
    describe("multiple response", function () {
      before(function () {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(
          Promise.resolve(require(__dirname + "/http_responses/calendar_multiple_series.json"))
        );
        robot.adapter.send = sinon.spy();
        send_message("!tonightTV");
      });
      it("output title", function () {
        robot.adapter.send.args.should.not.be.empty;
        robot.adapter.send.args[0][1].should.eql(
          "Upcoming shows:\nExtant - The Other Side,\n" +
          " Mr. Robot - eps1.8_m1rr0r1ng.qt,\n Why? With Hannibal Buress - Episode 7"
        );
        this.mock.verify();
      });
    });
  });

  describe("!addTV batman", function () {
    describe("failure", function () {
      before(function () {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(
          Promise.reject("Error 500")
        );
        robot.adapter.send = sinon.spy();

        send_message("!addTV batman");
      });
      it("output title", function () {
        robot.adapter.send.args.should.not.be.empty;
        robot.adapter.send.args[0][1].should.eql("Encountered an error :( Error 500");
        this.mock.verify();
      });
    });
    describe("empty response", function () {
      before(function () {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(
          Promise.resolve(require(__dirname + "/http_responses/series_lookup_empty.json"))
        );
        robot.adapter.send = sinon.spy();

        send_message("!addTV batman");
      });
      it("output title", function () {
        this.mock.verify();
        robot.adapter.send.args.should.not.be.empty;
        robot.adapter.send.args[0][1].should.eql("No results found for [batman]");
      });
    });
    describe("single response", function () {
      before(function () {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(
          Promise.resolve(require(__dirname + "/http_responses/series_lookup_single.json"))
        );
        robot.adapter.send = sinon.spy();
        send_message("!addTV batman");
      });
      it("output title", function () {
        this.mock.verify();
        robot.adapter.send.args.should.not.be.empty;
        robot.adapter.send.args[0][1].should.eql(
          "Results for [batman]:\nthe-blacklist) The Blacklist - " +
          "http://www.imdb.com/title/tt2741602 - http://thetvdb.com/?tab=series&id=266189"
        );
      });
    });
    describe("multiple response", function () {
      before(function () {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(
          Promise.resolve(require(__dirname + "/http_responses/series_lookup_batman.json"))
        );
        robot.adapter.send = sinon.spy();
        send_message("!addTV batman");
      });
      it("output title", function () {
        this.mock.verify();
        robot.adapter.send.args.should.not.be.empty;
        robot.adapter.send.args[0][1].should.eql(
          "Results for [batman]:\n" +
          [
            "batman) Batman - http://www.imdb.com/title/tt0059968 - http://thetvdb.com/?tab=series&id=77871",
            "batman-the-brave-and-the-bold) Batman: The Brave and the Bold - http://www.imdb.com/title/tt1213218 - http://thetvdb.com/?tab=series&id=82824",
            "batman-the-animated-series) Batman: The Animated Series - http://www.imdb.com/title/tt0103359 - http://thetvdb.com/?tab=series&id=76168",
            "batman-the-1943-serial) Batman: The 1943 Serial - http://www.imdb.com/title/tt0035665 - http://thetvdb.com/?tab=series&id=93341",
            "the-new-batman-adventures) The New Batman Adventures - http://www.imdb.com/title/tt0118266 - http://thetvdb.com/?tab=series&id=77084",
            "batman-and-robin---the-1949-serial) Batman and Robin - The 1949 Serial - http://www.imdb.com/title/tt0041162 - http://thetvdb.com/?tab=series&id=144771",
            "batman---black-and-white-motion-comics) Batman - Black and White Motion Comics - http://www.imdb.com/title/tt1458796 - http://thetvdb.com/?tab=series&id=103851"
          ].join(", \n")
        );
      });
    });
  });

});
