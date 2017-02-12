function act (c) {
	c.legNo = 0;
	c.leg = {};
	c.span = {};
	c.leg.span = c.span;
	c.alias = 'alias';
	c.name = 'foo';
	c.rows = {};

	c.limitQuery = {};
	c.queryContext = {
		limitQuery: c.limitQuery
	};
	c.filter = {};
	c.innerJoin = {};

	c.queryContext.filter = c.filter;
	c.queryContext.innerJoin = c.innerJoin;
	c.queryContext.alias = c.alias;

	c.parent.queryContext = c.queryContext;
	c.query = {};

	c.legToQuery.expect([], c.alias, c.leg, c.legNo, c.filter, c.innerJoin, c.limitQuery).return(c.query);

	c.subSpan = {};

	c.result = {};	
	c.resultPromise = c.then();
	c.resultPromise.resolve(c.result);
	c.executeQueries.expect(c.query).return(c.resultPromise);

	c.rowsPromise = c.then();
	c.rowsPromise.resolve(c.rows);
	c.resultToRows.expect(c.span, c.result).return(c.rowsPromise);

	c.queryContext.expand = c.mock();
	c.queryContext.expand.expect(c.relation);

	c.relation.toLeg = c.mock();
	c.relation.toLeg.expect().return(c.leg);	

	c.negotiateExpandInverse.expect(c.parent, c.relation, c.rows);

	c.sut(c.legToQuery, c.parent, c.relation).then(onResult);

	function onResult(rows) {
		c.returned = rows;
	}


}

module.exports = act;