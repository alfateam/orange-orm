var requireMock = require('a').requireMock;

function act(c) {	
	c.newRelatedTable = requireMock('./newRelatedTable');
	c.newJoinRelation = requireMock('./newJoinRelation');
	c.foo = {
		alias: 'fooProp',
		_dbName: 'foo'
	};
	c.bar = {
		alias: 'barProp',
		_dbName: 'bar'
	};
	c.baz = {
		alias: 'bazProp',
		_dbName: 'baz'
	};
	c.parentTable = {
		_columns: [c.foo, c.bar, c.baz],
		_relations: {}
	};

	c.childTable = {};
	c.sut = require('../join');
}

module.exports = act;