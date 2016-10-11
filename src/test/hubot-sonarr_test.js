//eslint-disable no-unused-expressions
//eslint-disable max-nested-callbacks
"use strict";

process.env.HUBOT_SONARR_HTTP = process.env.HUBOT_SONARR_HTTP || "http://sonarr/";
process.env.HUBOT_SONARR_API_KEY = process.env.HUBOT_SONARR_API_KEY || "12345-12345-1234";
process.env.EXPRESS_PORT = process.env.PORT = 0;

require("coffee-script/register");
var Hubot = require("hubot");
var Path = require("path");

require('es6-promise').polyfill();

var sinon = require("sinon");
var sinonAsPromised = require('sinon-as-promised');
require("should");
var request = require("supertest");
var sonarr = require("../scripts/sonarr.js");
var assign = require("object-assign");

var adapterPath = Path.join(Path.dirname(require.resolve("hubot")), "src", "adapters");
var robot = Hubot.loadBot(adapterPath, "shell", "true", "MochaHubot");
var TextMessage = require(Path.join(adapterPath, "../message")).TextMessage;

require("../scripts/hubot-sonarr")(robot);

var send_message = function (msg) {
  var user = robot.brain.userForId("1", { name: "Shell", room: "Shell" });
  robot.adapter.receive(new TextMessage(user, msg, "messageId"));
};

var notificationPOSTJSON = {
  "test": {"EventType":"Test","Message":"This is testing the webhook"},
  "grab": {"EventType":"Grab","Series":{"Id":2,"Title":"Gravity Falls","Path":"C:\\Temp\\sonarr\\Gravity Falls","TvdbId":259972},"Episodes":[{"Id":67,"EpisodeNumber":14,"SeasonNumber":2,"Title":"The Stanchurian Candidate","AirDate":"2015-08-24","AirDateUtc":"2015-08-25T01:30:00Z","Quality":"WEBDL-1080p","QualityVersion":1,"ReleaseGroup":"iT00NZ","SceneName":null}]},
  "download": {"EventType":"Download","Series":{"Id":2,"Title":"Gravity Falls","Path":"C:\\Temp\\sonarr\\Gravity Falls","TvdbId":259972},"Episodes":[{"Id":67,"EpisodeNumber":14,"SeasonNumber":2,"Title":"The Stanchurian Candidate","AirDate":"2015-08-24","AirDateUtc":"2015-08-25T01:30:00Z","Quality":"HDTV-720p","QualityVersion":1,"ReleaseGroup":null,"SceneName":null}]},
  "rename": {"EventType":"Rename","Series":{"Id":2,"Title":"Gravity Falls","Path":"C:\\Temp\\sonarr\\Gravity Falls","TvdbId":259972},"Episode":null}
};

describe("hubot_sonarr", function () {
  beforeEach(function() {
    if (this.mock) {
        if (this.mock.restore) {
          this.mock.restore();
        } else if (this.mock.reset) {
          this.mock.reset();
        } else {
          throw new Error("Not sure what to do with this mock");
        }
    }
  });
  describe("help", function () {
    it("all commands", function () {
      robot.helpCommands().should.eql([
        "!searchTV <query> - Searches sonarrs sources to find information about a tv show",
        "!tonightTV - Reports what should download in the upcoming day"
      ]);
    });
  });
  describe("!tonightTV", function () {
    describe("shouldn't work inline", function () {
      before(function () {
        robot.adapter.send = sinon.spy();
        send_message("aasdadasdasd !tonightTV");
      });
      it("output title", function () {
        robot.adapter.send.args.should.be.empty;
      });
    });
    describe("failure", function () {
      before(function () {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().rejects("Error 500");
        robot.adapter.send = sinon.spy();

        send_message("!tonightTV");
      });
      it("output title", function () {
        robot.adapter.send.args.should.not.be.empty;
        robot.adapter.send.args[0][1].should.eql("Encountered an error :( Error: Error 500");
        this.mock.restore();
      });
    });
    describe("empty response", function () {
      before(function () {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().resolves([]);
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

  describe("!searchTV batman", function () {
    describe("shouldn't work inline", function () {
      before(function () {
        robot.adapter.send = sinon.spy();
        send_message("aasdadasdasd !searchTV batman");
      });
      it("output title", function () {
        robot.adapter.send.args.should.be.empty;
      });
    });
    describe("failure", function () {
      before(function () {
        this.mock = sinon.mock(sonarr);
        this.mock.expects("fetchFromSonarr").once().returns(
          Promise.reject("Error 500")
        );
        robot.adapter.send = sinon.spy();

        send_message("!searchTV batman");
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

        send_message("!searchTV batman");
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
        send_message("!searchTV batman");
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
        send_message("!searchTV batman");
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
  describe("Sonarr Webhook", function () {
    it("Test Action", function (done) {
      robot.adapter.send = sinon.spy();
      request(robot.router)
        .post("/hubot/sonarr/random")
        .set("Content-Type", "application/json")
        .send(notificationPOSTJSON.test)
        .expect(200)
        .end(function () {
          robot.adapter.send.args.should.not.be.empty;
          robot.adapter.send.args[0][1].should.eql(
            "Now Tested: This is testing the webhook"
          );
          done();
        });
    });
    it("Downloaded Action", function (done) {
      robot.adapter.send = sinon.spy();
      request(robot.router)
        .post("/hubot/sonarr/random")
        .set("Content-Type", "application/json")
        .send(notificationPOSTJSON.download)
        .expect(200)
        .end(function () {
          robot.adapter.send.args.should.not.be.empty;
          robot.adapter.send.args[0][1].should.eql(
            "Now Downloading Gravity Falls: S02E14 - The Stanchurian Candidate [HDTV-720p]"
          );
          done();
        });
    });
    it("Rename Action", function (done) {
      robot.adapter.send = sinon.spy();
      request(robot.router)
        .post("/hubot/sonarr/random")
        .set("Content-Type", "application/json")
        .send(notificationPOSTJSON.rename)
        .expect(200)
        .end(function () {
          robot.adapter.send.args.should.not.be.empty;
          robot.adapter.send.args[0][1].should.eql(
            "Now Renameing Gravity Falls"
          );
          done();
        });
    });
    it("Grabbed Action", function (done) {
      robot.adapter.send = sinon.spy();
      request(robot.router)
        .post("/hubot/sonarr/random")
        .set("Content-Type", "application/json")
        .send(notificationPOSTJSON.grab)
        .expect(200)
        .end(function () {
          robot.adapter.send.args.should.not.be.empty;
          robot.adapter.send.args[0][1].should.eql(
            "Now Grabing Gravity Falls: S02E14 - The Stanchurian Candidate [WEBDL-1080p]"
          );
          done();
        });
    });
    it("Grabbed Action - Multi Channel Mode", function (done) {
      robot.adapter.send = sinon.spy();
      request(robot.router)
        .post("/hubot/sonarr/random?multiRoom=true")
        .set("Content-Type", "application/json")
        .send(notificationPOSTJSON.grab)
        .expect(200)
        .end(function () {
          robot.adapter.send.args.should.not.be.empty;
          robot.adapter.send.args[0][0].room.should.eql("random");
          robot.adapter.send.args[0][1].should.eql(
            "Now Grabing Gravity Falls: S02E14 - The Stanchurian Candidate [WEBDL-1080p]"
          );
          robot.adapter.send.args[1][0].room.should.eql("gravity_falls");
          robot.adapter.send.args[1][1].should.eql(
            "Now Grabing Gravity Falls: S02E14 - The Stanchurian Candidate [WEBDL-1080p]"
          );
          done();
        });
    });
  });

});
