var requireMock = require('a_mock').requireMock;

var joinLegToShallowJoinSql = requireMock('./joinLegToShallowJoinSql');
var newJoinSql = requireMock('../newJoinSql');

var shallowJoinSql = '<shallowJoinSql>';
var joinSql = '<nextJoinSql>';
var expected = shallowJoinSql + joinSql;
var alias = 'alias';
var childAlias = 'subAlias';
var leg = {};

function act(c) {
	joinLegToShallowJoinSql.expect(leg,alias,childAlias).return(shallowJoinSql);
	newJoinSql.expect(leg,childAlias).return(joinSql);
	c.expected = expected;
	c.returned = require('../joinLegToJoinSql')(leg,alias,childAlias);
}

module.exports = act;
