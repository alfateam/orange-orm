var requireMock = require('a').requireMock;

function act(c) {
	c.requireMock = requireMock;
	c.oneLegToShallowJoinSql = requireMock('./oneLegToShallowJoinSql');
	c.sut = require('../oneLegToJoinSql');
}

module.exports = act;
