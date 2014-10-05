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

	c.newSubFilter = requireMock('../../relatedTable/subFilter');

	c.sut = require('../newSingleCommand')(c.table, c.filter, c.relations);

}

module.exports = act;
