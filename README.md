# gh-issues-stats

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][codecov-image]][codecov-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url] [![Greenkeeper badge][greenkeeper-image]][greenkeeper-url]

[npm-url]:https://npmjs.org/package/gh-issues-stats
[downloads-image]:https://img.shields.io/npm/dm/gh-issues-stats.svg
[npm-image]:https://img.shields.io/npm/v/gh-issues-stats.svg
[travis-url]:https://travis-ci.org/moxystudio/node-gh-issues-stats
[travis-image]:http://img.shields.io/travis/moxystudio/node-gh-issues-stats/master.svg
[codecov-url]:https://codecov.io/gh/moxystudio/node-gh-issues-stats
[codecov-image]:https://img.shields.io/codecov/c/github/moxystudio/node-gh-issues-stats/master.svg
[david-dm-url]:https://david-dm.org/moxystudio/node-gh-issues-stats
[david-dm-image]:https://img.shields.io/david/moxystudio/node-gh-issues-stats.svg
[david-dm-dev-url]:https://david-dm.org/moxystudio/node-gh-issues-stats?type=dev
[david-dm-dev-image]:https://img.shields.io/david/dev/moxystudio/node-gh-issues-stats.svg
[greenkeeper-image]:https://badges.greenkeeper.io/moxystudio/node-gh-issues-stats.svg
[greenkeeper-url]:https://greenkeeper.io/

Collect statistical information about issues of a GitHub repository.


## Installation

```sh
$ npm install gh-issues-stats
```


## Usage

```js
const ghIssueStats = require('gh-issues-stats');

ghIssueStats('moxystudio/node-cross-spawn')
.then((stats) => {
    // `stats` looks like:
    // {
    //   issues: {
    //     count: 32,
    //     openCount: 2,
    //     distribution: {
    //       3600: 4,           // 1 hour
    //       10800: 20,         // 3 hours.. and so on
    //       32400: 6,
    //       97200: 2,
    //       291600: 0,
    //       874800: 0,
    //       2624400: 0,
    //       7873200: 0,
    //       23619600: 0,
    //       70858800: 0,
    //       212576400: 0,
    //     },
    //   },
    //   pullRequests: {
    //      .. same as above but for pull requests
    //   },
    // }
}, (err) => {
    console.log('Failed to fetch issue stats', err);
});
```

Available options:

- `apiUrl`: GitHub API URL, defaults to `https://api.github.com` (you may change to point to a GitHub enterprise instance).
- `tokens`: Array of API tokens to be used by [token-dealer](https://github.com/moxystudio/node-token-dealer), defaults to `null`.
- `concurrency`: The concurrency in which pages are requested, defaults to `5`.
- `got` Custom options to be passed to [got](https://github.com/sindresorhus/got), defaults to `{ timeout: 15000, headers: { accept: 'application/vnd.github.v3+json' } }`
- `tokenDealer`: Custom options to be passed to [token-dealer](https://github.com/moxystudio/node-token-dealer), defaults to `{ group: 'github' }`


## Tests

```sh
$ npm test
$ npm test-cov # to get coverage report
```


## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
