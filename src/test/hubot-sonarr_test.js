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
var Promise = require("bluebird");
require("should");
var request = require("supertest");
var sonarr = require("../scripts/sonarr.js");
var assign = require("object-assign");

var adapterPath = Path.join(Path.dirname(require.resolve("hubot")), "src", "adapters");
var robot = Hubot.loadBot(adapterPath, "shell", "true", "MochaHubot");
var TextMessage = require(Path.join(adapterPath, "../message")).TextMessage;

require("../scripts/hubot-sonarr")(robot);
robot.parseHelp(Path.join(__dirname, "../scripts/hubot-sonarr.js"));

var send_message = function (msg) {
  var user = robot.brain.userForId("1", { name: "Shell", room: "Shell" });
  robot.adapter.receive(new TextMessage(user, msg, "messageId"));
};

var notificationPOSTJSON = {
  "EventType": "Test",
  "Series": {
    "TvdbId": 1234,
    "TvRageId": 0,
    "ImdbId": null,
    "Title": "Test Title",
    "CleanTitle": null,
    "SortTitle": null,
    "Status": 0,
    "Overview": null,
    "AirTime": null,
    "Monitored": false,
    "ProfileId": 0,
    "SeasonFolder": false,
    "LastInfoSync": null,
    "Runtime": 0,
    "Images": [],
    "SeriesType": 0,
    "Network": null,
    "UseSceneNumbering": false,
    "TitleSlug": null,
    "Path": "Test Path",
    "Year": 0,
    "Ratings": null,
    "Genres": [],
    "Actors": [],
    "Certification": null,
    "RootFolderPath": null,
    "Added": "0001-01-01T08:00:00Z",
    "FirstAired": null,
    "Profile": null,
    "Seasons": [],
    "Tags": [],
    "AddOptions": null,
    "Id": 1
  },
  "EpisodeFile": {
    "SeriesId": 0,
    "SeasonNumber": 1,
    "RelativePath": "RelativePath",
    "Path": "/linux/test/path/",
    "Size": 0,
    "DateAdded": "0001-01-01T08:00:00Z",
    "SceneName": null,
    "ReleaseGroup": null,
    "Quality": {
      "Quality": {
        "Id": 0,
        "Name": "blah"
      },
      "Revision": {
        "Version": 1,
        "Real": 0
      }
    },
    "MediaInfo": null,
    "Episodes": {
      "Value": [
        {
          "SeriesId": 0,
          "EpisodeFileId": 0,
          "SeasonNumber": 0,
          "EpisodeNumber": 1234,
          "Title": null,
          "AirDate": "2015-08-23 10:46:25 AM",
          "AirDateUtc": "2015-08-23T17:46:25.9707345Z",
          "Overview": null,
          "Monitored": false,
          "AbsoluteEpisodeNumber": null,
          "SceneAbsoluteEpisodeNumber": null,
          "SceneSeasonNumber": null,
          "SceneEpisodeNumber": null,
          "UnverifiedSceneNumbering": false,
          "Ratings": null,
          "Images": [],
          "SeriesTitle": null,
          "EpisodeFile": null,
          "Series": null,
          "HasFile": false,
          "Id": 0
        }
      ],
      "IsLoaded": true
    },
    "Series": null,
    "Id": 1
  }
};

describe("hubot_sonarr", function () {
  describe("help", function () {
    it("all commands", function () {
      robot.helpCommands().should.eql([
        "!searchTV <query>",
        "!tonightTV"
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
        .send(notificationPOSTJSON)
        .expect(200)
        .end(function () {
          robot.adapter.send.args.should.not.be.empty;
          robot.adapter.send.args[0][1].should.eql(
            "Now Tested: \nTest Title - S00E34 - "
          );
          done();
        });
    });
    it("Downloaded Action", function (done) {
      var data = assign({}, notificationPOSTJSON, {
        "EventType": "Download"
      });
      robot.adapter.send = sinon.spy();
      request(robot.router)
        .post("/hubot/sonarr/random")
        .set("Content-Type", "application/json")
        .send(data)
        .expect(200)
        .end(function () {
          robot.adapter.send.args.should.not.be.empty;
          robot.adapter.send.args[0][1].should.eql(
            "Now Downloaded: \nTest Title - S00E34 - "
          );
          done();
        });
    });
    it("Rename Action", function (done) {
      var data = assign({}, notificationPOSTJSON, {
        "EventType": "Rename"
      });
      delete data.EpisodeFile;
      robot.adapter.send = sinon.spy();
      request(robot.router)
        .post("/hubot/sonarr/random")
        .set("Content-Type", "application/json")
        .send(data)
        .expect(200)
        .end(function () {
          robot.adapter.send.args.should.not.be.empty;
          robot.adapter.send.args[0][1].should.eql(
            "Now Renameed: Test Title"
          );
          done();
        });
    });
    it("Grabbed Action", function (done) {
      var data = {
        EventType: "Grab",
        Message: "Fear the Walking Dead - 1x01 - Pilot [WEBDL-1080p]"
      };
      robot.adapter.send = sinon.spy();
      request(robot.router)
        .post("/hubot/sonarr/random")
        .set("Content-Type", "application/json")
        .send(data)
        .expect(200)
        .end(function () {
          robot.adapter.send.args.should.not.be.empty;
          robot.adapter.send.args[0][1].should.eql(
            "Now Grabed: Fear the Walking Dead - 1x01 - Pilot [WEBDL-1080p]"
          );
          done();
        });
    });
  });

});
