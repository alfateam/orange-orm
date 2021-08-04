var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c) {
    c.mock = mock;

    c.tryReleaseDbClient = requireMock('./tryReleaseDbClient');
    c.tryReleaseDbClient.expect();
    
    c.error = {};
    c.previousPromise = {};
    c.previousPromise.then = mock();

    c.expected = {};
    c.previousPromise.then.expectAnything().expectAnything().whenCalled(interceptCallback).return (c.expected);

    c.throwFunc = function() {};
    function interceptCallback(cb,cb2) {
        c.throwFunc = cb;
        c.throwFunc2 = cb2;
    }

    c.returned = require('../newThrow')(c.error, c.previousPromise);
    try {
        c.throwFunc();
    } catch (e) {
        c.thrownError = e;
    }
}

module.exports = act;