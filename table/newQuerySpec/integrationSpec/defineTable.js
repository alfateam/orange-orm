var a = require('a');
var requireMock = a.requireMock;
var newQuery;
var alias = '_0';
var strategyToSpan = require('../../strategyToSpan');
var table;
var customerTable;
var countryTable;
var lineTable;
var packageTable;
var emptyInnerJoin = require('../../query/newParameterized')();

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
		defineOrderLines();
		definePackages();
		var customerJoin = table.join(customerTable).by('oCustomerId').as('customer');
		var countryJoin = customerTable.join(countryTable).by('cCountryId').as('country');		
		var orderJoin = lineTable.join(table).by('lOrderId').as('order');
		table.hasMany(orderJoin).as('lines');
		var lineJoin = packageTable.join(lineTable).by('pLineId').as('line');
		lineTable.hasMany(lineJoin).as('packages');		
	};

	function defineOrder() {
		table = newTable('order');
		table.primaryColumn('oOrderId').integer().as('id');
		table.column('oCustomerId').integer().as('customerId');		
		table.columnDiscriminators('discriminatorColumn=\'foo\'','discriminatorColumn2=\'baz\'');
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

	function defineOrderLines() {
		lineTable = newTable('orderLine');
		lineTable.primaryColumn('lId').integer().as('id');
		lineTable.column('lLineNo').integer().as('lineNo');
		lineTable.column('lOrderId').integer().as('orderId');
	}

	function definePackages() {
		packageTable = newTable('package');
		packageTable.primaryColumn('pId').integer().as('id');
		packageTable.column('pLineId').integer().as('lineId');
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
		c.returned = newQuery(table,c.filter,span,alias,emptyInnerJoin);		
	}

}

module.exports = act;