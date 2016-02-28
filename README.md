# gh-issuestats

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url]

[npm-url]:https://npmjs.org/package/gh-issuestats
[downloads-image]:http://img.shields.io/npm/dm/gh-issuestats.svg
[npm-image]:http://img.shields.io/npm/v/gh-issuestats.svg
[travis-url]:https://travis-ci.org/IndigoUnited/node-gh-issuestats
[travis-image]:http://img.shields.io/travis/IndigoUnited/node-gh-issuestats/master.svg
[coveralls-url]:https://coveralls.io/r/IndigoUnited/node-gh-issuestats
[coveralls-image]:https://img.shields.io/coveralls/IndigoUnited/node-gh-issuestats/master.svg
[david-dm-url]:https://david-dm.org/IndigoUnited/node-gh-issuestats
[david-dm-image]:https://img.shields.io/david/IndigoUnited/node-gh-issuestats.svg
[david-dm-dev-url]:https://david-dm.org/IndigoUnited/node-gh-issuestats#info=devDependencies
[david-dm-dev-image]:https://img.shields.io/david/dev/IndigoUnited/node-gh-issuestats.svg

Collect statistical information about issues of a GitHub repository.


## Installation

`$ npm install gh-issuestats`


## Usage

```js
const ghIssueStats = require('gh-issuestats');

ghIssueStats('IndigoUnited/node-cross-spawn')
.then((stats) => {
    // `stats` looks like:
    // {
    //   count: 32,
    //   openCount: 2,
    //   distribution: {
    //     3600: 4,           // 1 hour
    //     10800: 20,         // 3 hours.. and so on
    //     32400: 6,
    //     97200: 2,
    //     291600: 0,
    //     874800: 0,
    //     2624400: 0,
    //     7873200: 0,
    //     23619600: 0,
    //     70858800: 0,
    //     212576400: 0,
    //   }
    // }
}, (err) => {
    console.log('Failed to fetch issue stats', err);
});
```

Available options:

- `apiUrl`: GitHub API URL, defaults to `https://api.github.com` (you may change to point to a GitHub enterprise instance).
- `tokens`: Array of API tokens to be used by [token-dealer](https://github.com/IndigoUnited/node-token-dealer), defaults to `null`.
- `concurrency`: The concurrency in which pages are requested, defaults to `5`.
- `got` Custom options to be passed to [got](https://github.com/sindresorhus/got), defaults to `{ timeout: 15000, json: true }`
- `tokenDealer`: Custom options to be passed to [token-dealer](https://github.com/IndigoUnited/node-token-dealer), defaults to `{ group: 'github' }`


## Tests

`$ npm test`   
`$ npm test-cov` to get coverage report


## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
