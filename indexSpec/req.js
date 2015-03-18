var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c) {
    c.emptyFilter = requireMock('./emptyFilter');
    c.mock = mock;
    c.table = requireMock('./table');
    c.commit = requireMock('./table/commit');
    c.rollback = requireMock('./table/rollback');
    c.pools = requireMock('./pools');
    c.log = requireMock('./table/log');
    c.log.registerLogger = {};

    c.newDatabase = requireMock('./pg/newDatabase');
    c.newMySqlDatabase = requireMock('./mySql/newDatabase');

    c.pools.end = {};

    c.sut = require('../index');
}

module.exports = act;
