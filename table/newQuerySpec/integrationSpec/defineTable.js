var a = require('a');
var requireMock = a.requireMock;
var newQuery;
var alias = '_0';
var strategyToSpan = require('../../strategyToSpan');
var table;
var customerTable;

function act(c) {
	createMocks();
	defineTable();	
	setupSut();	

	function createMocks() {
		requireMock('./executeQuery');
		requireMock('./resultToRows');
		requireMock('./tryGetFromCacheById');
		c.requireMock = requireMock;
		c.mock = a.mock;
	}

	function defineTable() {
		table = newTable('order');
		table.primaryColumn('id').integer();
		table.column('invoicedCustomerId').integer();

		customerTable = newTable('customer');
		customerTable.primaryColumn('customerId').integer();

		var customerJoin = table.join(customerTable).by('invoicedCustomerId').as('invoicedCustomer');
		
		c.table = table;	
	};

	function newTable(tableName) {
		return require('../../../table')(tableName);
	};

	function setupSut() {
		newQuery = require('../../newQuery');
		c.newQuery = _newQuery;
	}

	function _newQuery() {
		var span = strategyToSpan(table, c.strategy);
		c.returned = newQuery(table,c.filter,span,alias);
	}

}

module.exports = act;