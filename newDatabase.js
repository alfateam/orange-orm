var createDomain = require('domain').create;
var newTransaction = require('./newTransaction');
var newPromise = require('./table/promise');
var begin = require('./table/begin');
var commitAndRollback = require('./commitAndRollback');

function newDatabase(connectionString) {
	var c = {};
	
	c.transaction = function() {
		var domain = createDomain();
		var transaction = newTransaction(domain, connectionString);
		var commitAndRollbackPromise = newPromise(commitAndRollback);
		return newPromise(transaction).then(begin).then(commitAndRollbackPromise);
	};

	return c;
};

module.exports = newDatabase;