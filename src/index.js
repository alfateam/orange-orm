var newPg = require('./pg/newDatabase');
var hostExpress = require('./hostExpress');
var client = require('./client/index.js');
var _sqlite;
var _mssql;
var _sap;
var flags = require('./flags');

var connectViaPool = function(connectionString) {
	if (connectionString.indexOf && connectionString.indexOf('mysql') === 0)
		return connectViaPool.mySql.apply(null, arguments);
	else if (connectionString.indexOf && connectionString.indexOf('http') === 0)
		return client.apply(null, arguments);
	else
		return newPg.apply(null, arguments);
};

connectViaPool.pg = newPg;
connectViaPool.mySql = require('./mySql/newDatabase');
connectViaPool.table = require('./table');
connectViaPool.filter = require('./emptyFilter');
connectViaPool.commit = require('./table/commit');
connectViaPool.rollback = require('./table/rollback');
connectViaPool.end = require('./pools').end;
connectViaPool.log = require('./table/log').registerLogger;
connectViaPool.query = require('./query');
connectViaPool.lock = require('./lock');
connectViaPool.schema = require('./pg/schema');

Object.defineProperty(connectViaPool, 'sqlite', {
	get: function() {
		if (!_sqlite)
			_sqlite = require('./sqlite/newDatabase');
		return _sqlite;
	}
});

Object.defineProperty(connectViaPool, 'mssql', {
	get: function() {
		if (!_mssql)
			_mssql = require('./mssql/newDatabase');
		return _mssql;
	}
});

Object.defineProperty(connectViaPool, 'sap', {
	get: function() {
		if (!_sap)
			_sap = require('./sap/newDatabase');
		return _sap;
	}
});

connectViaPool.express = hostExpress;
connectViaPool.useHook = function(bool) {
	flags.useHook = bool;
};

module.exports = connectViaPool;