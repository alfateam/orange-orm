var a = require('a');

function act(c) {
    c.mock = a.mock;
    c.requireMock = a.requireMock;
    c.expectRequire = a.expectRequire;
    c.then = a.then;

    c.executeChanges = c.requireMock('../executeQueries/executeChanges');
    c.popChanges = c.requireMock('../popChanges');

    c.changes = {};
    c.popChanges.expect().return(c.changes);
    c.expected = {};
    c.executeChanges.expect(c.changes).return(c.expected);

    c.returned = require('../flush')();
}

module.exports = act;
