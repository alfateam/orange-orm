var table = {};
var filter = {};
var strategy = {};
var expected = {};
var query = query;
var result = {};
var expected = {};
var span = {};
var alias = '_0';

function act(c) {
	c.strategyToSpan.expect(table,strategy).return(span);
	c.newSelectQuery.expect(table,filter,span,alias,c.emptyInnerJoin).return(query)
	c.executeQuery.expect(query).return(result);
	c.resultToRows.expect(table,span,result).return(expected);
	c.expected = expected;
	c.returned = c.sut(table,filter,strategy);
}

act.base = "../new";
module.exports = act;