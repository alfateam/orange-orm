var table = {};
var initialFilter = {};
var filter = {};
var strategy = {};
var expected = {};
var query = {};
var expected = {};
var span = {};
var dbName = '_theTable';
var resultPromise = {};
var stream = {};
var domain = {};
var db = {};

function act(c) {
	c.table = table;
	c.table._dbName = dbName;
	c.span = span;
	c.strategyToSpan.expect(table,strategy).return(span);
	c.negotiateRawSqlFilter.expect(initialFilter).return(filter);
	c.newSelectQuery.expect(table,filter,span,dbName).return(query)
	c.newQueryStream.expect(query).return(stream);

	c.expected = stream;	
	c.returned = c.sut(db, domain, table, initialFilter, strategy);
}

module.exports = act;