var a = require('a');
var requireMock = a.requireMock;

function act(c) {
    c.newBoolean = requireMock('./newBoolean');
    c.encodeFilterArg = requireMock('./encodeFilterArg');

    c.mock = a.mock;
    c.column = {};
    c.column._dbName = 'columnName';
    c.sut = require('../greaterThan');
}

module.exports = act;
