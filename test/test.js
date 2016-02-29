'use strict';

const nockBack = require('nock').back;
const expect = require('chai').expect;
const ghIssueStats = require('../');

let nockBackDone;

nockBack.fixtures = `${__dirname}`;
nockBack.setMode('record');
nockBack('fixtures.json', { enable_reqheaders_recording: true }, (done) => { nockBackDone = done; });

describe('gh-issues-stats', () => {
    after(nockBackDone);

    it('should give stats of a repository with a single issues page', () => {
        return ghIssueStats('IndigoUnited/node-gloth')
        .then((stats) => {
            console.log(stats);
        });
    });

    it('should give stats of a repository with multiple issues page');

    it('should use options.apiUrl');

    it('should respect options.concurrency');

    it('should use options.tokens when fetching pages');

    it('should pass options.got to got()');

    it('should pass options.tokenDealer to options.tokenDealer');

    it('should identify rate limit errors correctly');
});
