'use strict';

const https = require('https');
const nock = require('nock');
const nockBack = require('nock').back;
const expect = require('chai').expect;
const tokenDealer = require('token-dealer');
const ghIssueStats = require('../');

nockBack.fixtures = `${__dirname}/fixtures`;

const tokens = [];  // Add your token here if you are recording fixtures, but do not commit

describe('gh-issues-stats', () => {
    const originalDateNow = Date.now;

    function mockDateNow() {
        Date.now = function () { return 1458477519537; };
    }

    afterEach(() => {
        Date.now = originalDateNow;

        nock.cleanAll();
        nock.disableNetConnect();
    });

    it('should give stats of a repository with a single issues page', () => {
        let nockBackDone;

        nockBack('gloth.json', (done) => { nockBackDone = done; });
        mockDateNow();

        return ghIssueStats('IndigoUnited/node-gloth', { tokens })
        .then((stats) => {
            nockBackDone();

            expect(stats).to.eql({
                issues: {
                    count: 0,
                    openCount: 0,
                    distribution: {
                        3600: 0,
                        10800: 0,
                        32400: 0,
                        97200: 0,
                        291600: 0,
                        874800: 0,
                        2624400: 0,
                        7873200: 0,
                        23619600: 0,
                        70858800: 0,
                        212576400: 0,
                    },
                },
                pullRequests: {
                    count: 1,
                    openCount: 0,
                    distribution: {
                        3600: 1,
                        10800: 0,
                        32400: 0,
                        97200: 0,
                        291600: 0,
                        874800: 0,
                        2624400: 0,
                        7873200: 0,
                        23619600: 0,
                        70858800: 0,
                        212576400: 0,
                    },
                },
            });
        });
    });

    it('should give stats of a repository with multiple issues page', () => {
        let nockBackDone;

        nockBack('nodejs.json', (done) => { nockBackDone = done; });
        mockDateNow();

        return ghIssueStats('nodejs/node', { tokens })
        .then((stats) => {
            nockBackDone();

            expect(stats).to.eql({
                issues: {
                    count: 2567,
                    openCount: 509,
                    distribution: {
                        3600: 370,
                        10800: 142,
                        32400: 171,
                        97200: 240,
                        291600: 237,
                        874800: 268,
                        2624400: 322,
                        7873200: 357,
                        23619600: 359,
                        70858800: 101,
                        212576400: 0,
                    },
                },
                pullRequests: {
                    count: 3226,
                    openCount: 253,
                    distribution: {
                        3600: 355,
                        10800: 200,
                        32400: 254,
                        97200: 491,
                        291600: 627,
                        874800: 507,
                        2624400: 343,
                        7873200: 246,
                        23619600: 181,
                        70858800: 22,
                        212576400: 0,
                    },
                },
            });
        });
    });

    it('should use options.apiUrl', () => {
        nock('http://example.com')
          .get('/repos/my-org/my-repo/issues')
          .query(true)
          .reply(200, []);

        return ghIssueStats('my-org/my-repo', { apiUrl: 'http://example.com' })
        .then((stats) => {
            expect(stats.issues.count).to.equal(0);
            expect(stats.pullRequests.count).to.equal(0);
        });
    });

    it('should use options.tokens when fetching pages, preserving the accept header', () => {
        let headers;

        nock('https://api.github.com')
          .get('/repos/my-org/my-repo/issues')
          .query(true)
          .reply(200, function () {
              headers = this.req.headers;
              return [];
          });

        return ghIssueStats('my-org/my-repo', { tokens: ['my-token'] })
        .then(() => {
            expect(headers.authorization).to.equal('token my-token');
            expect(headers.accept).to.equal('application/vnd.github.v3+json');
        });
    });

    it('should respect options.concurrency', () => {
        let nockBackDone;

        nockBack('nodejs.json', (done) => { nockBackDone = done; });

        // Record concurrency
        let concurrency = 0;
        const concurrencyStack = [];
        const originalRequest = https.request;

        https.request = function (options, callback) {
            concurrency += 1;
            concurrencyStack.push(concurrency);

            return originalRequest.call(https, options, (res) => {
                res.on('end', () => { concurrency -= 1; });
                callback(res);
            });
        };

        return ghIssueStats('nodejs/node', { tokens, concurrency: 1 })
        .then(() => {
            nockBackDone();

            expect(concurrencyStack).to.have.length(58);
            concurrencyStack.forEach((concurrency) => expect(concurrency).to.equal(1));
        });
    });

    it('should pass options.got to got()', () => {
        let retriesCount = 0;
        const retries = () => { retriesCount += 1; return 0; };

        return ghIssueStats('my-org/my-repo', { got: { retries } })
        .then(() => {
            throw new Error('Should have failed');
        }, (err) => {
            expect(err.message).to.match(/not allow net/i);
            expect(retriesCount).to.equal(1);
        });
    });

    it('should pass options.tokenDealer to token-dealer', () => {
        nock('https://api.github.com')
          .get('/repos/my-org/my-repo/issues')
          .query(true)
          .reply(200, []);

        return ghIssueStats('my-org/my-repo', { tokens: ['my-token'], tokenDealer: { group: 'my-group' } })
        .then(() => {
            expect(tokenDealer.defaultLru.get('my-group#my-token')).to.be.an('object');
        });
    });

    it('should identify rate limit errors correctly', () => {
        const authorizationHeaders = [];

        nock('https://api.github.com')
          .get('/repos/my-org/my-repo/issues')
          .query(true)
          .reply(403, function () {
              authorizationHeaders.push(this.req.headers.authorization);

              return {
                  message: 'API rate limit exceeded',
                  documentation_url: 'https://developer.github.com/v3/#rate-limiting',
              };
          }, {
              'x-ratelimit-limit': '5000',
              'x-ratelimit-remaining': '0',
              'x-ratelimit-reset': Math.floor(Date.now() / 1000) + 10 * 60,
          });

        nock('https://api.github.com')
          .get('/repos/my-org/my-repo/issues')
          .query(true)
          .reply(200, function () {
              authorizationHeaders.push(this.req.headers.authorization);
              return [];
          }, {
              'x-ratelimit-limit': '5000',
              'x-ratelimit-remaining': '4999',
              'x-ratelimit-reset': Math.floor(Date.now() / 1000) + 60 * 60,
          });

        return ghIssueStats('my-org/my-repo', { got: { retries: 0 }, tokens: ['my-token', 'my-alternative-token'] })
        .then((stats) => {
            expect(stats.issues.count).to.equal(0);
            expect(stats.pullRequests.count).to.equal(0);
            expect(authorizationHeaders).to.eql(['token my-token', 'token my-alternative-token']);
        });
    });
});
