var requireMock = require('a').requireMock;


var table = {};
var filter = {};
var span = {};
var alias = '_2';
var parameters = {};
var innerJoin = {};

function act(c) {	
	filter.parameters = parameters;
	c.table = table;
	c.filter = filter;
	c.relations = {};
	c.relations.length = 3;
	c.alias = '_0_0_0_0';
	//todo
	// c.newWhereSql = requireMock('../../query/singleQuery/newWhereSql');

	c.newSubFilter = c.requireMock('../../relatedTable/subFilter');
	

}

module.exports = act;
