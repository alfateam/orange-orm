function act (c) {
	c.table = {};
	c.alias = 'alias';
	c.name = 'foo';
	c.joinRelation = {};
	c.joinRelation.leftAlias = c.name;
	c.relation.joinRelation = c.joinRelation;
	c.joinRelation.childTable = c.table;
	c.queryContext = {};
	c.filter = {};
	c.innerJoin = {};

	c.queryContext.filter = c.filter;
	c.queryContext.innerJoin = c.innerJoin;
	c.queryContext.alias = c.alias;

	c.parent.queryContext = c.queryContext;
	
	c.query = {};

	c.strategy = {foo: null};

	c.span = {};
	c.strategyToSpan.expect(c.table, c.strategy).return(c.span);
	c.addSubQueries.expect([],c.table,c.filter,c.span,c.alias,c.innerJoin).whenCalled(onAdd);

	function onAdd(subQueries) {
		subQueries.push(c.query);
	}

	c.subSpan = {};
	c.leg = {};
	c.leg.span = c.subSpan;
	c.legs = {};
	c.span.legs = c.legs;
	c.legs.forEach = c.mock();
	c.legs.forEach.expectAnything().whenCalled(onEachLeg);

	function onEachLeg(cb) {
		cb(c.leg);
	}

	c.result = {};
	c.resultPromise = c.then();
	c.resultPromise.resolve(c.result);
	c.executeQueries.expect([c.query]).return(c.resultPromise);

	c.resultToRows.expect(c.subSpan, c.result);

	c.queryContext.expand = c.mock();
	c.queryContext.expand.expect(c.relation);

	c.sut(c.parent, c.relation);


}

module.exports = act;