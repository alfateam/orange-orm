var a = require('a');
var requireMock = a.requireMock;
var newQuery;
var alias = '_0';
var strategyToSpan = require('../../table/strategyToSpan');
var table;
var customerTable;
var countryTable;
var lineTable;
var packageTable;
var deliveryPartyTable;
var emptyInnerJoin = require('../../table/query/newParameterized')();

function act(c) {
	createMocks();
	defineTable();	
	setupSut();	

	function createMocks() {
		requireMock('./executeQueries');
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
		defineDeliveryParty();
	};

	function defineOrder() {
		table = newTable('order');
		table.primaryColumn('oOrderId').integer().as('id');
		table.column('oCustomerId').string().as('customerId');		
		table.columnDiscriminators('discriminatorColumn=\'foo\'','discriminatorColumn2=\'baz\'');
		c.orderTable = table;
	}		

	function defineCustomer() {
		customerTable = newTable('customer');
		customerTable.primaryColumn('cCustomerId').string().as('id');
		customerTable.column('cName').string().as('name');
		customerTable.column('cCountryId').string().as('countryId');
		var customerJoin = table.join(customerTable).by('oCustomerId').as('customer');
	}

	function defineCountry() {
		countryTable = newTable('country');
		countryTable.primaryColumn('yCountryId').integer().as('id');
		countryTable.column('yCountryName').string().as('name');
		var countryJoin = customerTable.join(countryTable).by('cCountryId').as('country');		
	}

	function defineOrderLines() {
		lineTable = newTable('orderLine');
		lineTable.primaryColumn('lId').integer().as('id');
		lineTable.column('lLineNo').integer().as('lineNo');
		lineTable.column('lOrderId').integer().as('orderId');
		var orderJoin = lineTable.join(table).by('lOrderId').as('order');
		table.hasMany(orderJoin).as('lines');

	}

	function definePackages() {
		packageTable = newTable('package');
		packageTable.primaryColumn('pId').integer().as('id');
		packageTable.column('pLineId').integer().as('lineId');
		var lineJoin = packageTable.join(lineTable).by('pLineId').as('line');
		lineTable.hasMany(lineJoin).as('packages');		
	}

	function defineDeliveryParty() {
		deliveryPartyTable = newTable('deliveryParty');
		deliveryPartyTable.primaryColumn('dId').integer().as('id');
		deliveryPartyTable.column('dOrderId').integer().as('orderId');
		var orderJoin = deliveryPartyTable.join(table).by('dOrderId').as('order');
		table.hasOne(orderJoin).as('deliveryParty');
	};

	function newTable(tableName) {
		return require('../../table')(tableName);
	};

	function setupSut() {
		newQuery = require('../../table/newQuery');
		c.newQuery = _newQuery;
	}

	function _newQuery() {
		var span = strategyToSpan(table, c.strategy);
		c.returned = newQuery([],table,c.filter,span,alias,emptyInnerJoin);		
	}

}

module.exports = act;