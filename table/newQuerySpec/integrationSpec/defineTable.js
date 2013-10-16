var a = require('a');
var requireMock = a.requireMock;
var newQuery;
var alias = '_0';
var legs = require('../../../newCollection')();

function act(c) {
	createMocks();
	defineTable();	
	setupSut();	

	function createMocks() {
		requireMock('./executeQuery');
		requireMock('./resultToRows');
		requireMock('./tryGetFromCacheById');
		requireMock('./strategyToSpan');
		c.filter = undefined;
		c.span = {};		
		c.span.legs = legs;		
		c.requireMock = requireMock;
		c.mock = a.mock;
	}

	function defineTable() {
		table = require('../../../table')('order');
		table.primaryColumn('id').integer();
		c.table = table;
	}

	function setupSut() {
		newQuery = require('../../newQuery');
		c.newQuery = _newQuery;
	}

	function _newQuery() {
		c.returned = newQuery(table,c.filter,c.span,alias);
	}

}

module.exports = act;