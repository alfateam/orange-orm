var a = require('a');
var requireMock = a.requireMock;
var newQuery;
var alias = '_0';
var strategyToSpan = require('../../strategyToSpan');
var table;
var customerTable;
var countryTable;

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
		defineOrder();
		defineCustomer();
		defineCountry();
		var customerJoin = table.join(customerTable).by('oCustomerId').as('customer');
		var countryJoin = customerTable.join(countryTable).by('cCountryId').as('country');		
	};

	function defineOrder() {
		table = newTable('order');
		table.primaryColumn('oOrderId').integer().as('id');
		table.column('oCustomerId').integer().as('customerId');		
	}		

	function defineCustomer() {
		customerTable = newTable('customer');
		customerTable.primaryColumn('cCustomerId').integer().as('id');
		customerTable.column('cName').string().as('name');
		customerTable.column('cCountryId').string().as('countryId');
	}

	function defineCountry() {
		countryTable = newTable('country');
		countryTable.primaryColumn('yCountryId').integer().as('id');
		countryTable.column('yCountryName').string().as('name');
	}

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