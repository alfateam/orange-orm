var requireMock = require('a').requireMock;
var dbNull  = {};

function act(c) {
	c.dbNull = dbNull;
	c.returned = c.sut.dbNull(dbNull);
}

act.base = '../new';
module.exports = act;