var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.fooRelation = {};
	c.barRelation = {};
	c.bazRelation = {};

	c.fooTable = {};
	c.fooRelation.childTable = c.fooTable;

	c.barTable = {};
	c.barRelation.childTable = c.barTable;

	c.table = {};
	c.relations = {foo: c.fooRelation, bar: c.barRelation, baz: c.bazRelation};
	c.table._relations = c.relations;
	c.row = {};

	c.sut = require('../removeFromCache');
}

module.exports = act;