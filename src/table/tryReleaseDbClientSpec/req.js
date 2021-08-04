var a = require('a');

function act(c) {
    c.mock = a.mock;
    c.requireMock = a.requireMock;
    c.expectRequire = a.expectRequire;
    c.then = a.then;

    c.releaseDbClient = c.requireMock('./releaseDbClient');

    c.sut = require('../tryReleaseDbClient');
}

module.exports = act;
