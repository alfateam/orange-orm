var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var expectRequire = a.expectRequire;
var parentTable = {};
var childTable = {};
var columnNames = ['foo','bar'];
var idColumn = {}, fooColumn = {}, barColumn = {};

function act(c){
	parentTable._columns = [idColumn,fooColumn,barColumn];
	idColumn._dbName = 'id';
	fooColumn._dbName = 'foo';
	barColumn._dbName = 'bar';
	c.childTable = childTable;
	c.parentTable = parentTable;
	c.fooColumn = fooColumn;
	c.barColumn = barColumn;
	c.sut = require('../newJoinRelation')(parentTable,childTable,columnNames);
}

module.exports = act;