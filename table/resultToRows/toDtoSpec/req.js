var a = require('a');

function act(c) {
    c.mock = a.mock;
    c.requireMock = a.requireMock;
    c.expectRequire = a.expectRequire;
    c.then = a.then;

    c.resultToPromise = c.requireMock('../resultToPromise');
    c.createDto = c.requireMock('./toDto/createDto');

    c.sut = require('../toDto');
}

module.exports = act;
