var requireMock = require('a').requireMock;
var mock = require('a').mock;
var newSingleCommand = requireMock('./delete/newSingleCommand');

var table = {};
var filter = {};
var singleCommand = {};
var childStrategy1 = {},
	childStrategy2 = {};
var strategy = {child1: childStrategy1, child2 : childStrategy2};
var alias = '_2;'
var expected = {};
var fooRelation = {},
	barRelation = {};
var relations = [fooRelation, barRelation];
var childRelation1 = {};
var joinRelation1 = {};
var childRelation2 = {};
var joinRelation2 = {};

var childTable1 = {};
var childTable2 = {};

childRelation1.childTable = childTable1;
childRelation1.joinRelation = joinRelation1;
childRelation2.childTable = childTable2;
childRelation2.joinRelation = joinRelation2;

table._relations = {};

table._relations.child1 = childRelation1;
table._relations.child2 = childRelation2;


function act(c) {
	c.queries2 = {};
	c.queries = {};
	c.queries.push = mock();
	c.queries.push.expect(singleCommand);
	
	newSingleCommand.expect(table,filter,relations).return(singleCommand);

	c.nextDeleteCommand = requireMock('./newDeleteCommand');
	c.nextDeleteCommand.expect(c.queries, childTable1, filter, childStrategy1, [joinRelation1, fooRelation, barRelation]);
	c.nextDeleteCommand.expect(c.queries, childTable2, filter, childStrategy2, [joinRelation2, fooRelation, barRelation]);

	c.returned = require('../newDeleteCommand')(c.queries,table,filter,strategy,relations);
}

module.exports = act;
