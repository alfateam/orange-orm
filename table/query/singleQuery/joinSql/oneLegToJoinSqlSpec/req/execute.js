var oneLegToShallowJoinSql; 
var shallowJoinSql = '<shallowJoinSql>';
var joinSql = '<nextJoinSql>';
var expected = shallowJoinSql + joinSql;
var alias = 'alias';
var childAlias = 'subAlias';
var leg = {};
var span = {};

function act(c) {
	leg.span = span;
	c.oneLegToShallowJoinSql.expect(leg,alias,childAlias).return(shallowJoinSql);
	c.newJoinSql = c.requireMock('../newJoinSql');
	c.newJoinSql.expect(span,childAlias).return(joinSql);
	c.expected = expected;
	c.returned = c.sut(leg,alias,childAlias);
}

act.base = '../req';
module.exports = act;
