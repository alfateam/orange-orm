var a = require('a');

function act(c) {
	c.then = a.then;
	c.mock = a.mock;
	c.requireMock = a.requireMock;

	c.strategyToSpan = c.requireMock('../strategyToSpan');
	c.addSubQueries = c.requireMock('../query/addSubQueries');
	c.executeQueries = c.requireMock('../executeQueries');
	c.resultToRows = c.requireMock('../resultToRows');

	c.table = {};
	c.relation = {};
	c.joinRelation = {};
	c.relation.joinRelation = c.joinRelation;
	c.joinRelation.childTable = c.table;
	c.queryContext = {};
	c.filter = {};
	c.innerJoin = {};
	c.alias = 'alias';

	c.queryContext.filter = c.filter;
	c.queryContext.innerJoin = c.innerJoin;
	c.queryContext.alias = c.alias;
	c.query = {};

	c.name = 'foo';
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

	c.rows = {};
	c.resultToRows.expect(c.subSpan, c.result).return(c.rows);

	require('../newFarRelativesQuery')(c.relation, c.queryContext, c.name).then(onResult);

	function onResult(rows) {
		c.returned = rows;
	}
}

module.exports = act;