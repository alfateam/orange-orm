const hostExpress = require('./hostExpress');
const hostLocal = require('./hostLocal');
const client = require('./client/index.js');
const map = require('./client/map');
let _mySql;
let _pg;
let _sqlite;
let _mssqlNative;
let _sap;
let _mssql;
let _oracle;
let _d1;

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

Object.defineProperty(connectViaPool, 'd1', {
	get: function() {
		if (!_d1)
			_d1 = require('./d1/newDatabase');
		return _d1;
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

connectViaPool.express = hostExpress.bind(null, hostLocal);

module.exports = connectViaPool;