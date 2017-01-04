var requireMock = require('a').requireMock;
var mock = require('a').mock;

function act(c) {
	c.mock = mock;
    c.newMySqlQuery = requireMock('./mySql/newQuery');
    c.newPgQuery = requireMock('./pg/newQuery');
    c.db = {};
    c.table = {};
    c.initialFilter = {};
    c.span = {};
    c.alias = {};

    c.db.accept = c.mock();
    
    c.sut = require('../newQuery');
}

module.exports = act;
