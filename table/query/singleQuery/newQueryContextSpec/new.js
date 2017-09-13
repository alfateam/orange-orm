var a = require('a');

function act(c) {
    c.mock = a.mock;
    c.requireMock = a.requireMock;
    c.expectRequire = a.expectRequire;
    c.then = a.then;
    c.expandRows = c.mock();

    c.sut = require('../newQueryContext')();
}

module.exports = act;
