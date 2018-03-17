/* eslint-env mocha */
process.env.HUBOT_SONARR_HTTP = process.env.HUBOT_SONARR_HTTP || 'http://sonarr/';
process.env.HUBOT_SONARR_API_KEY = process.env.HUBOT_SONARR_API_KEY || '12345-12345-1234';
process.env.EXPRESS_PORT = process.env.PORT = 0;

require('should');
const path = require('path');
const sinon = require('sinon');
const sonarr = require('../scripts/sonarr.js');
const request = require('supertest');
const Helper = require('hubot-test-helper');
const helper = new Helper('../scripts/hubot-sonarr.js');

var notificationPOSTJSON = {
  'test': {'EventType': 'Test', 'Message': 'This is testing the webhook'},
  'grab': {'EventType': 'Grab', 'Series': {'Id': 2, 'Title': 'Gravity Falls', 'Path': 'C:\\Temp\\sonarr\\Gravity Falls', 'TvdbId': 259972}, 'Episodes': [{'Id': 67, 'EpisodeNumber': 14, 'SeasonNumber': 2, 'Title': 'The Stanchurian Candidate', 'AirDate': '2015-08-24', 'AirDateUtc': '2015-08-25T01:30:00Z', 'Quality': 'WEBDL-1080p', 'QualityVersion': 1, 'ReleaseGroup': 'iT00NZ', 'SceneName': null}]},
  'download': {'EventType': 'Download', 'Series': {'Id': 2, 'Title': 'Gravity Falls', 'Path': 'C:\\Temp\\sonarr\\Gravity Falls', 'TvdbId': 259972}, 'Episodes': [{'Id': 67, 'EpisodeNumber': 14, 'SeasonNumber': 2, 'Title': 'The Stanchurian Candidate', 'AirDate': '2015-08-24', 'AirDateUtc': '2015-08-25T01:30:00Z', 'Quality': 'HDTV-720p', 'QualityVersion': 1, 'ReleaseGroup': null, 'SceneName': null}]},
  'rename': {'EventType': 'Rename', 'Series': {'Id': 2, 'Title': 'Gravity Falls', 'Path': 'C:\\Temp\\sonarr\\Gravity Falls', 'TvdbId': 259972}, 'Episode': null}
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('hubot_sonarr', function () {
  beforeEach(() => {
    this.room = helper.createRoom();
    if (this.mock) {
      if (this.mock.restore) {
        this.mock.restore();
      } else if (this.mock.reset) {
        this.mock.reset();
      } else {
        throw new Error('Not sure what to do with this mock');
      }
    }
  });
  afterEach(() => {
    this.room.destroy();
  });
  describe('help', () => {
    it('all commands', () => {
      this.room.robot.helpCommands().should.eql([
        '!searchTV <query> - Searches sonarrs sources to find information about a tv show',
        '!tonightTV - Reports what should download in the upcoming day'
      ]);
    });
  });
  describe('!tonightTV', () => {
    describe("shouldn't work inline", () => {
      it('output title', () => {
        return this.room.user.say('Shell', 'aasdadasdasd !tonightTV').then(() => {
          this.room.messages.should.eql([
            ['Shell', 'aasdadasdasd !tonightTV']
          ]);
        });
      });
    });
    describe('failure', () => {
      it('output title', () => {
        this.mock = sinon.mock(sonarr);
        this.mock.expects('fetchFromSonarr').once().rejects(new Error('Error 500'));

        return this.room.user.say('Shell', '!tonightTV').then(() => sleep(1)).then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '!tonightTV'],
            ['hubot', 'Encountered an error :( Error: Error 500']
          ]);
        });
      });
    });
    describe('empty response', () => {
      it('output title', () => {
        this.mock = sinon.mock(sonarr);
        this.mock.expects('fetchFromSonarr').once().resolves([]);

        return this.room.user.say('Shell', '!tonightTV')
          .then(() => sleep(10))
          .then(() => {
            this.mock.verify();
            this.room.messages.should.eql([
              ['Shell', '!tonightTV'],
              ['hubot', 'Upcoming shows:\n']
            ]);
          });
      });
    });
    describe('single response', () => {
      it('output title', () => {
        this.mock = sinon.mock(sonarr);
        this.mock.expects('fetchFromSonarr').once().resolves(
          require(path.join(__dirname, '/http_responses/calendar_single_series.json'))
        );
        return this.room.user.say('Shell', '!tonightTV')
          .then(() => sleep(10))
          .then(() => {
            this.mock.verify();
            this.room.messages.should.eql([
              ['Shell', '!tonightTV'],
              ['hubot', "Upcoming shows:\nBob's Burgers - Easy Com-mercial, Easy Go-mercial"]
            ]);
          });
      });
    });
    describe('multiple response', () => {
      it('output title', () => {
        this.mock = sinon.mock(sonarr);
        this.mock.expects('fetchFromSonarr').once().resolves(
          require(path.join(__dirname, '/http_responses/calendar_multiple_series.json'))
        );
        return this.room.user.say('Shell', '!tonightTV')
          .then(() => sleep(10))
          .then(() => {
            this.mock.verify();
            this.room.messages.should.eql([
              ['Shell', '!tonightTV'],
              ['hubot', 'Upcoming shows:\nExtant - The Other Side,\n' +
                ' Mr. Robot - eps1.8_m1rr0r1ng.qt,\n Why? With Hannibal Buress - Episode 7']
            ]);
          });
      });
    });
  });

  describe('!searchTV batman', () => {
    it("shouldn't work inline", () => {
      return this.room.user.say('Shell', 'aasdadasdasd !searchTV batman')
        .then(() => sleep(10))
        .then(() => {
          this.room.messages.should.eql([
            ['Shell', 'aasdadasdasd !searchTV batman']
          ]);
        });
    });
    it('failure', () => {
      this.mock = sinon.mock(sonarr);
      this.mock.expects('fetchFromSonarr').once().rejects(new Error('Error 500'));

      return this.room.user.say('Shell', '!searchTV batman')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '!searchTV batman'],
            ['hubot', 'Encountered an error :( Error: Error 500']
          ]);
        });
    });
    it('empty response', () => {
      this.mock = sinon.mock(sonarr);
      this.mock.expects('fetchFromSonarr').once().resolves(
        require(path.join(__dirname, '/http_responses/series_lookup_empty.json'))
      );
      return this.room.user.say('Shell', '!searchTV batman')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '!searchTV batman'],
            ['hubot', 'No results found for [batman]']
          ]);
        });
    });
    it('single response', () => {
      this.mock = sinon.mock(sonarr);
      this.mock.expects('fetchFromSonarr').once().resolves(
        require(path.join(__dirname, '/http_responses/series_lookup_single.json'))
      );
      return this.room.user.say('Shell', '!searchTV batman')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '!searchTV batman'],
            [
              'hubot',
              'Results for [batman]:\nthe-blacklist) The Blacklist - ' +
              'http://www.imdb.com/title/tt2741602 - http://thetvdb.com/?tab=series&id=266189'
            ]
          ]);
        });
    });
    it('multiple response', () => {
      this.mock = sinon.mock(sonarr);
      this.mock.expects('fetchFromSonarr').once().resolves(
        require(path.join(__dirname, '/http_responses/series_lookup_batman.json'))
      );
      return this.room.user.say('Shell', '!searchTV batman')
        .then(() => sleep(10))
        .then(() => {
          this.mock.verify();
          this.room.messages.should.eql([
            ['Shell', '!searchTV batman'],
            ['hubot', 'Results for [batman]:\n' +
              [
                'batman) Batman - http://www.imdb.com/title/tt0059968 - http://thetvdb.com/?tab=series&id=77871',
                'batman-the-brave-and-the-bold) Batman: The Brave and the Bold - http://www.imdb.com/title/tt1213218 - http://thetvdb.com/?tab=series&id=82824',
                'batman-the-animated-series) Batman: The Animated Series - http://www.imdb.com/title/tt0103359 - http://thetvdb.com/?tab=series&id=76168',
                'batman-the-1943-serial) Batman: The 1943 Serial - http://www.imdb.com/title/tt0035665 - http://thetvdb.com/?tab=series&id=93341',
                'the-new-batman-adventures) The New Batman Adventures - http://www.imdb.com/title/tt0118266 - http://thetvdb.com/?tab=series&id=77084',
                'batman-and-robin---the-1949-serial) Batman and Robin - The 1949 Serial - http://www.imdb.com/title/tt0041162 - http://thetvdb.com/?tab=series&id=144771',
                'batman---black-and-white-motion-comics) Batman - Black and White Motion Comics - http://www.imdb.com/title/tt1458796 - http://thetvdb.com/?tab=series&id=103851'
              ].join(', \n')
            ]
          ]);
        });
    });
  });
  describe('Sonarr Webhook', () => {
    it('Test Action', (done) => {
      request(this.room.robot.router)
        .post('/hubot/sonarr/' + this.room.robot.adapter.name)
        .set('Content-Type', 'application/json')
        .send(notificationPOSTJSON.test)
        .expect(200)
        .end(() => {
          this.room.messages.should.eql([
            ['hubot', 'Now Tested: This is testing the webhook']
          ]);
          done();
        });
    });
    it('Downloaded Action', (done) => {
      request(this.room.robot.router)
        .post('/hubot/sonarr/' + this.room.robot.adapter.name)
        .set('Content-Type', 'application/json')
        .send(notificationPOSTJSON.download)
        .expect(200)
        .end(() => {
          this.room.messages.should.eql([
            ['hubot', 'Now Downloading Gravity Falls: S02E14 - The Stanchurian Candidate [HDTV-720p]']
          ]);
          done();
        });
    });
    it('Rename Action', (done) => {
      request(this.room.robot.router)
        .post('/hubot/sonarr/' + this.room.robot.adapter.name)
        .set('Content-Type', 'application/json')
        .send(notificationPOSTJSON.rename)
        .expect(200)
        .end(() => {
          this.room.messages.should.eql([
            ['hubot', 'Now Renameing Gravity Falls']
          ]);
          done();
        });
    });
    it('Grabbed Action', (done) => {
      request(this.room.robot.router)
        .post('/hubot/sonarr/' + this.room.robot.adapter.name)
        .set('Content-Type', 'application/json')
        .send(notificationPOSTJSON.grab)
        .expect(200)
        .end(() => {
          this.room.messages.should.eql([
            ['hubot', 'Now Grabing Gravity Falls: S02E14 - The Stanchurian Candidate [WEBDL-1080p]']
          ]);
          done();
        });
    });
    it('Grabbed Action - Multi Channel Mode', (done) => {
      request(this.room.robot.router)
        .post('/hubot/sonarr/' + this.room.robot.adapter.name + '?multiRoom=true')
        .set('Content-Type', 'application/json')
        .send(notificationPOSTJSON.grab)
        .expect(200)
        .end(() => {
          // FIXME - spy on this.room.messages.send and see what param 1's room is
          this.room.messages.should.eql([
            ['hubot', 'Now Grabing Gravity Falls: S02E14 - The Stanchurian Candidate [WEBDL-1080p]'] // random
          ]);
          done();
        });
    });
  });
});
