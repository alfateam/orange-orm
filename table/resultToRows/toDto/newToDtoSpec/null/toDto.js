var mock = require('a').mock;
var requireMock = require('a').requireMock;

function act(c) {
    c.row = null;
    c.dtoPromise = {};
    c.nullPromise = {};
    c.expected = c.nullPromise;
    c.resultToPromise.expect(null).return(c.nullPromise);

    c.returned = c.sut(c.row);
}

module.exports = act;