const hostExpress = require('./hostExpress');
const hostHono = require('./hostHono');
const hostLocal = require('./hostLocal');
const client = require('./client/index.js');
const map = require('./client/map');
let _d1;
let _pg;
let _pglite;

var connectViaPool = function() {
	return client.apply(null, arguments);
};
connectViaPool.createPatch = client.createPatch;
connectViaPool.table = require('./table');
connectViaPool.filter = require('./emptyFilter');
connectViaPool.commit = require('./table/commit');
connectViaPool.rollback = require('./table/rollback');
connectViaPool.end = require('./pools').end;
connectViaPool.close = connectViaPool.end;
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


Object.defineProperty(connectViaPool, 'd1', {
	get: function() {
		if (!_d1)
			_d1 = require('./d1/newDatabase');
		return _d1;
	}
});

Object.defineProperty(connectViaPool, 'pglite', {
	get: function() {
		if (!_pglite)
			_pglite = require('./pglite/newDatabase');
		return _pglite;
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


connectViaPool.express = hostExpress.bind(null, hostLocal);
connectViaPool.hono = hostHono.bind(null, hostLocal);

module.exports = connectViaPool;
