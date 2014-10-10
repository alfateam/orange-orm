var a = require('a');
var requireMock = a.requireMock;

var table = {};
var filter = {};
var span = {};
var alias = '_2';
var parameters = {};
var innerJoin = {};

function act(c) {	
	c.mock = a.mock;
	c.parameters = parameters;
	filter.parameters = parameters;
	c.table = table;
	c.filter = filter;
	c.relations = {};

	c.newSubFilter = requireMock('./singleCommand/subFilter');
	c.newDiscriminatorSql  = requireMock('../../query/singleQuery/newDiscriminatorSql');
	
	c.newSut = require('../newSingleCommand');

}

module.exports = act;
