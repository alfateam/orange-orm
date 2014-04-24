var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c) {
    c.mock = mock;
    c.error = {};
    c.previousPromise = {};
    c.previousPromise.then = mock();

    c.expected = {};
    c.previousPromise.then.expectAnything().whenCalled(interceptCallback).return (c.expected);

    c.throwFunc = function() {};
    function interceptCallback(cb) {
        c.throwFunc = cb;
    }

    c.returned = require('../newThrow')(c.error, c.previousPromise);
    try {
        c.throwFunc();
    } catch (e) {
        c.thrownError = e;
    }
}

module.exports = act;