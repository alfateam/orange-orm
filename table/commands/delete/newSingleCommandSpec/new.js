var requireMock = require('a').requireMock;


var table = {};
var filter = {};
var span = {};
var alias = '_2';
var parameters = {};
var innerJoin = {};

function act(c) {	
	filter.parameters = parameters;
	c.parameters = parameters;
	c.alias = alias;
	c.table = table;
	c.filter = filter;
	c.span = span;
	c.innerJoin = innerJoin;
	c.relations = {};
	c.relations.length = 3;
	c.alias = '_0_0_0_0';
	//todo
	c.newWhereSql = requireMock('../../query/singleQuery/newWhereSql');
	c.sut = require('../newSingleCommand')(table,filter,strategy,relations);
}

module.exports = act;
