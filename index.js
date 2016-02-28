'use strict';

const url = require('url');
const got = require('got');
const PThrottler = require('p-throttler');
const merge = require('lodash.merge');
const tokenDealer = require('token-dealer');
const parseLink = require('github-parse-link');

const distributionRanges = [3600, 10800, 32400, 97200, 291600, 874800, 2624400, 7873200, 23619600, 70858800, 212576400];

function doRequest(url, options) {
    // Use token dealer to circumvent rate limit issues
    return tokenDealer(options.tokens, (token, exhaust) => {
        const handleResponse = (response, err) => {
            if (response.headers['x-ratelimit-remaining'] === '0') {
                const isRateLimitError = err && err.statusCode === 403 && /rate limit/i.test(response.body.message);

                exhaust(Number(response.headers['x-ratelimit-reset']) * 1000, isRateLimitError);
            }
        };

        return got(url, merge({}, options.got, {
            headers: token ? { Authorization: `token ${token}` } : null,
        }))
        .then((response) => {
            handleResponse(response);
            return response;
        }, (err) => {
            err.response && handleResponse(err.response, err);
            throw err;
        });
    }, options.tokenDealer);
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
    issues.forEach((issue) => {
        // Update count
        stats.count += 1;

        // Update open count
        if (issue.state === 'open') {
            stats.openCount += 1;
        }

        // Update distribution count
        const closedTimestamp = (issue.closed_at ? Date.parse(issue.closed_at) : Date.now());
        const openTime = (closedTimestamp - Date.parse(issue.created_at)) / 1000;

        const rangeIndex = distributionRanges.findIndex((range, index, ranges) => {
            const previousRange = ranges[index - 1] || 0;

            return openTime >= previousRange && openTime < range;
        });
        const range = distributionRanges[rangeIndex === -1 ? distributionRanges.length - 1 : rangeIndex];

        stats.distribution[range] += 1;
    });
}

function generateEmptyStats() {
    const stats = {
        count: 0,
        openCount: 0,
        distribution: {},
    };

    distributionRanges.forEach((range) => {
        stats.distribution[range] = 0;
    });

    return stats;
}

// -------------------------------------------------

function ghIssueStats(repository, options) {
    options = merge({
        apiUrl: 'https://api.github.com',     // GitHub API URL, you may change to point to a GitHub enterprise instance
        tokens: null,                         // Array of API tokens to be used by `token-dealer`
        concurrency: 5,                       // The concurrency in which pages are requested

        got: { timeout: 15000, json: true },  // Custom options to be passed to `got`
        tokenDealer: { group: 'github' },     // Custom options to be passed to `token-dealer`
    }, options);

    const stats = generateEmptyStats();
    const issuesUrl = url.resolve(options.apiUrl, `repos/${repository}/issues?state=all&per_page=100`);

    // Fetch first page
    return doRequest(issuesUrl, options)
    .then((response) => {
        parsePage(response.body, stats);

        // Fetch the remaining pages concurrently
        const remainingPages = getPagesAsArray(response.headers.link).slice(1);
        const throttler = PThrottler.create(options.concurrency);
        const promises = remainingPages.map((page) => {
            return throttler.enqueue(() => {
                return doRequest(`${issuesUrl}&page=${page}`, options)
                .then((response) => parsePage(response.body, stats));
            });
        });

        return Promise.all(promises);
    })
    .then(() => stats);
}

module.exports = ghIssueStats;
