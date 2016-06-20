var a = require('a');

function act(c) {
    c.mock = a.mock;
    c.requireMock = a.requireMock;
    c.expectRequire = a.expectRequire;
    c.then = a.then;

    c.getSessionContext = c.requireMock('../getSessionContext');    
    c.popChanges = c.requireMock('../popChanges')
    c.executeChanges = c.requireMock('../executeQueries/executeChanges');

    c.context = {};
    c.getSessionContext.expect().return(c.context);

    c.changes = {};
    c.popChanges.expect().return(c.changes);
    c.expected = {};
    c.executeChanges.expect(c.changes).return(c.expected);

    c.sut = require('../flush');
}

module.exports = act;
