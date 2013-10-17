var requireMock = require('a').requireMock;

var joinLegToShallowJoinSql = requireMock('./joinLegToShallowJoinSql');;
var newJoinSql;

var shallowJoinSql = '<shallowJoinSql>';
var joinSql = '<nextJoinSql>';
var expected = shallowJoinSql + joinSql;
var alias = 'alias';
var childAlias = 'subAlias';
var leg = {};
var sut;
var span = {};

function act(c) {
	leg.span = span;
	joinLegToShallowJoinSql.expect(leg,alias,childAlias).return(shallowJoinSql);	
	c.expected = expected;
	sut = require('../joinLegToJoinSql');
	newJoinSql = requireMock('../newJoinSql')
	newJoinSql.expect(span,childAlias).return(joinSql);		
	c.returned = sut(leg,alias,childAlias);
}

module.exports = act;
