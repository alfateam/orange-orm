var a = require('a');

function act(c) {
    c.mock = a.mock;
    c.requireMock = a.requireMock;
    c.expectRequire = a.expectRequire;
    c.then = a.then;
    c.alias = 'foo';
    c.filter = {};
    c.expandRows = c.mock();
    c.newemitEvent = c.requireMock('../../../emitEvent');
    c.newemitEvent.expect().return(c.expandRows);

    c.newCollection = c.requireMock('../../../newCollection');
    c.rows = {};
    c.newCollection.expect().return(c.rows);

    c.sut = require('../newQueryContext')(c.filter, c.alias, c.innerJoin);
}

module.exports = act;
