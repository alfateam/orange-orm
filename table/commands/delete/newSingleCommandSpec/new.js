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
	c.newWhereSql = requireMock('../../query/singleQuery/newWhereSql');
	c.newSelfJoin = requireMock('./singleCommand/newSelfJoin');
	c.sut = require('../newSingleCommand')(table,filter,span,alias,innerJoin);
}

module.exports = act;
