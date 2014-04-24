var createDomain = require('domain').create;
var newTransaction = require('./newTransaction');
var newPromise = require('./table/promise');
var begin = require('./table/begin');
var commitAndRollback = require('./commitAndRollback');
var commit = require('./table/commit');
var rollback = require('./table/rollback');

function newDatabase(connectionString) {
	var c = {};
	
	c.transaction = function() {
		var domain = createDomain();
		var transaction = newTransaction(domain, connectionString);
		var commitAndRollbackPromise = newPromise(commitAndRollback);
		var p = newPromise(transaction).then(begin);
		p.commit = commit;
		p.rollback = rollback;
		return p;
	};

	return c;
};

module.exports = newDatabase;