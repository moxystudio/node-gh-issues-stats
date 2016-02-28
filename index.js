'use strict';

const url = require('url');
const got = require('got');
const promtie = require('promtie');
const deepAssign = require('deep-assign');
const tokenDealer = require('token-dealer');
const parseLink = require('github-parse-link');

function doRequest(url, options) {
    // Use token dealer to circumvent rate limit issues
    return tokenDealer(options.tokens, (token, exhaust) => {
        const handleResponse = (response, err) => {
            if (response.headers['x-ratelimit-remaining'] === '0') {
                const isRateLimitError = err && err.statusCode === 403 && /rate limit/i.test(response.body.message);

                exhaust(Number(response.headers['x-ratelimit-reset']) * 1000, isRateLimitError);
            }
        };

        return got(url, deepAssign({}, options.got, {
            headers: token ? { Authorization: `token ${token}` } : null,
        }))
        .then((response) => {
            handleResponse(response);
            return response;
        }, (err) => {
            err.response && handleResponse(err.response, err);
            throw err;
        });
    }, options.tokenDealer)
    .then((response) => response.body);
}

function getPagesAsArray(linkHeader) {
    const links = parseLink(linkHeader);
    const match = (links.last || '').match(/page=(\d+)$/);
    const totalPages = match ? Number(match[1]) : 0;
    const pages = [];

    for (let x = 1; x <= totalPages; x += 1) {
        pages.push(x);
    }

    return pages;
}

function parsePage(issues, stats) {
    const distributionRanges = Object.keys(stats.distribution);

    issues.forEach((issue) => {
        // Update count
        stats.count += 1;

        // Update open count
        if (issue.state === 'open') {
            stats.openCount += 1;
        }

        // Update distribution count
        const openTime = (issue.closed_at ? Date.parse(issue.closed_at) : Date.now()) - Date.parse(issue.created_at);
        const rangeIndex = distributionRanges.findIndex((range, index, ranges) => {
            const nextRange = ranges[index + 1];

            return openTime <= range && (!nextRange || openTime <= nextRange);
        });

        stats[distributionRanges[rangeIndex]] += 1;
    });
}

// -------------------------------------------------

function ghIssueStats(repository, options) {
    options = deepAssign({
        apiUrl: 'https://api.github.com',     // Custom GitHub API URL to support GitHub enterprise
        tokens: null,                         // Array of API tokens to be used by `token-dealer`
        concurrency: 5,                       // The concurrency in which pages are requested

        got: { timeout: 15000, json: true },  // Custom options to be passed to `got`
        tokenDealer: { group: 'github' },     // Custom options to be passed to `token-dealer`
    });

    const issuesUrl = url.resolve(options.apiUrl, `repos/${repository}/issues`);
    const stats = {
        count: 0,
        openCount: 0,
        distribution: {
            3600: 0, 10800: 0, 32400: 0, 97200: 0, 291600: 0, 874800: 0,
            2624400: 0, 7873200: 0, 23619600: 0, 70858800: 0, 212576400: 0,
        },
    };

    // Fetch first page
    return doRequest(issuesUrl, options)
    .spread((response) => {
        parsePage(response.body, stats);

        const remainingPages = getPagesAsArray(response.headers.link).slice(1);

        // Fetch the remaining pages concurrently
        return promtie.map(remainingPages, (page) => {
            return doRequest(`${issuesUrl}?page=${page}`, options)
            .then((response) => parsePage(response.body, stats));
        }, { concurrency: options.concurrency });
    })
    .then(() => stats);
}

module.exports = ghIssueStats;
