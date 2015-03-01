var filter = require('./emptyFilter');
var newBoolean = require('./table/column/newBoolean');
var newPg = require('./pg/newDatabase');
var newMysql = require('./mySql/newDatabase');
var table = require('./table');
var commit = require('./table/commit');
var rollback = require('./table/rollback');

var connectViaPool = function(connectionString, poolOptions) {
	return newPg(connectionString, poolOptions);
};

connectViaPool.pg = newPg;
connectViaPool.mySql = newMysql;
connectViaPool.table = table;
connectViaPool.filter = filter;
connectViaPool.commit = commit;
connectViaPool.rollback = rollback;

module.exports = connectViaPool;
