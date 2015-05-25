var newPg = require('./pg/newDatabase');

var connectViaPool = function(connectionString, poolOptions) {
	if (connectionString.indexOf && connectionString.indexOf('mysql') === 0)
		return connectViaPool.mySql.apply(null, arguments);
	return newPg.apply(null, arguments);
};

connectViaPool.pg = newPg;
connectViaPool.mySql = require('./mySql/newDatabase');
connectViaPool.sqlite = require('./sqlite/newDatabase');
connectViaPool.table = require('./table');
connectViaPool.filter = require('./emptyFilter');
connectViaPool.commit = require('./table/commit');
connectViaPool.rollback = require('./table/rollback');
connectViaPool.end = require('./pools').end;
connectViaPool.log = require('./table/log').registerLogger;
module.exports = connectViaPool;
