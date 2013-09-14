var requireMock = require('a').requireMock;

var oneLegToShallowJoinSql = requireMock('./oneLegToShallowJoinSql');
var newJoinSql = requireMock('../newJoinSql');

var shallowJoinSql = '<shallowJoinSql>';
var joinSql = '<nextJoinSql>';
var expected = shallowJoinSql + joinSql;
var alias = 'alias';
var childAlias = 'subAlias';
var leg = {};

function act(c) {
	oneLegToShallowJoinSql.expect(leg,alias,childAlias).return(shallowJoinSql);
	newJoinSql.expect(leg,childAlias).return(joinSql);
	c.expected = expected;
	c.returned = require('../oneLegToJoinSql')(leg,alias,childAlias);
}

module.exports = act;
