var a = require('a');

function act(c) {
	c.then = a.then;
	c.mock = a.mock;
	c.requireMock = c.requireMock;
	c.queryContext = {};
	c.filter = {};
	c.filterWithJoin = {};
	c.innerJoin = {};
	c.expected = c.filterWithJoin;
	c.filter.append(c.innerJoin).return(c.filterWithJoin);
	c.alias = '_n';
	//c.expected = 'select _n0 where exists (SELECT _n.id FROM theTable as _n WHERE prevFilter and joinFromNTo_n0';
	c.returned = require('../newFarRelativesFilter')(c.relation, c.queryContext);
}