var newPg = require('./pg/newDatabase');
var hostExpress = require('./hostExpress');
var _sqlite;
var flags = require('./flags');

console.log('hello rdb');

var connectViaPool = function(connectionString) {
	if (connectionString.indexOf && connectionString.indexOf('mysql') === 0)
		return connectViaPool.mySql.apply(null, arguments);
	if (connectionString.indexOf && connectionString.indexOf('postgres') === 0)
		return newPg.apply(null, arguments);
	else
		return connectViaPool.http.apply(null, arguments);
};

connectViaPool.pg = newPg;
connectViaPool.mySql = require('./mySql/newDatabase');
connectViaPool.http = require('./http/newDatabase');
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

connectViaPool.express = hostExpress;
connectViaPool.useHook = function(bool) {
	flags.useHook = bool;
};

module.exports = connectViaPool;