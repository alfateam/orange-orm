var hostExpress = require('./hostExpress');
var client = require('./client/index.js');
var _mySql;
var _pg;
var _sqlite;
var _mssqlNative;
var _sap;
var _mssql;
var _oracle;
var flags = require('./flags');
var map = require('./client/map');

var connectViaPool = function(connectionString) {
	if (connectionString.indexOf && connectionString.indexOf('mysql') === 0)
		return connectViaPool.mySql.apply(null, arguments);
	else if (connectionString.indexOf && connectionString.indexOf('postgres') === 0)
		connectViaPool.pg.apply(null, arguments);
	else
		return client.apply(null, arguments);
};
connectViaPool.createPatch = client.createPatch;
connectViaPool.table = require('./table');
connectViaPool.filter = require('./emptyFilter');
connectViaPool.commit = require('./table/commit');
connectViaPool.rollback = require('./table/rollback');
connectViaPool.end = require('./pools').end;
connectViaPool.log = require('./table/log').registerLogger;
connectViaPool.on = require('./table/log').on;
connectViaPool.off = require('./table/log').off;
connectViaPool.query = require('./query');
connectViaPool.lock = require('./lock');
connectViaPool.schema = require('./pg/schema');
connectViaPool.map = map.bind(null, connectViaPool);

connectViaPool.http = function(url) {
	return url;
};

Object.defineProperty(connectViaPool, 'mysql', {
	get: function() {
		if (!_mySql)
			_mySql = require('./mySql/newDatabase');
		return _mySql;
	}
});

Object.defineProperty(connectViaPool, 'mySql', {
	get: function() {
		if (!_mySql)
			_mySql = require('./mySql/newDatabase');
		return _mySql;
	}
});

Object.defineProperty(connectViaPool, 'postgres', {
	get: function() {
		if (!_pg)
			_pg = require('./pg/newDatabase');
		return _pg;
	}
});

Object.defineProperty(connectViaPool, 'pg', {
	get: function() {
		if (!_pg)
			_pg = require('./pg/newDatabase');
		return _pg;
	}
});

Object.defineProperty(connectViaPool, 'sqlite', {
	get: function() {
		if (!_sqlite)
			_sqlite = require('./sqlite/newDatabase');
		return _sqlite;
	}
});

Object.defineProperty(connectViaPool, 'mssqlNative', {
	get: function() {
		if (!_mssqlNative)
			_mssqlNative = require('./mssql/newDatabase');
		return _mssqlNative;
	}
});

Object.defineProperty(connectViaPool, 'mssql', {
	get: function() {
		if (!_mssql)
			_mssql = require('./tedious/newDatabase');
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

Object.defineProperty(connectViaPool, 'oracle', {
	get: function() {
		if (!_oracle)
			_oracle = require('./oracle/newDatabase');
		return _oracle;
	}
});

connectViaPool.express = hostExpress;
connectViaPool.useHook = function(bool) {
	flags.useHook = bool;
};

module.exports = connectViaPool;