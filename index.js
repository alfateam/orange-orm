var newPg = require('./pg/newDatabase');

var connectViaPool = function(connectionString, poolOptions) {
	return newPg(connectionString, poolOptions);
};

connectViaPool.pg = newPg;
connectViaPool.mySql = require('./mySql/newDatabase');
connectViaPool.table = require('./table');
connectViaPool.filter = require('./emptyFilter');
connectViaPool.commit = require('./table/commit');
connectViaPool.rollback = require('./table/rollback');
connectViaPool.end = require('./pools').end;
connectViaPool.log = require('./table/log').registerLogger;
module.exports = connectViaPool;
