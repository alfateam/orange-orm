var a = require('a');

function act(c) {
    c.mock = a.mock;
    c.requireMock = a.requireMock;
    c.expectRequire = a.expectRequire;
    c.then = a.then;

    var oldDomain = process.domain;
    process.domain = {};
    c.expected = {};
    process.domain.rdb = c.expected;

    c.returned = require('../getSessionContext')();
    process.domain = oldDomain;

}

module.exports = act;
