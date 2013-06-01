var requireMock = require('a_mock').requireMock;
var dbNull  = {};

function act(c) {
	c.dbNull = dbNull;
	c.returned = c.sut.dbNull(dbNull);
}

act.base = '../new';
module.exports = act;