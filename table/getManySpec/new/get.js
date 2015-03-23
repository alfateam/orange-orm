var table = {};
var initialFilter = {};
var filter = {};
var strategy = {};
var expected = {};
var queries = {};
var expected = {};
var span = {};
var alias = '_0';
var resultPromise = {};

function act(c) {
	c.table = table;
	c.span = span;
	c.strategyToSpan.expect(table,strategy).return(span);
	c.newSelectQuery.expect([],table,filter,span,alias,c.emptyInnerJoin).return(queries)
	
	c.executeQuery.expect(queries).return(resultPromise);
	resultPromise.then = c.mock();
	resultPromise.then.expectAnything().whenCalled(onThen).return(expected);

	function onThen(callback) {
		c.resolve = callback;
	}

	c.negotiateRawSqlFilter.expect(initialFilter).return(filter);
	
	c.expected = expected;
	c.returned = c.sut(table, initialFilter, strategy);
}

module.exports = act;