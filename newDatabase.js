var createDomain = require('domain').create;
var newTransaction = require('./newTransaction');
var newPromise = require('./table/promise');
var begin = require('./table/begin');

function newDatabase(connectionString) {
	var c = {};
	
	c.transaction = function() {
		var domain = createDomain();
		var transaction = newTransaction(domain, connectionString);
		return newPromise(transaction).then(begin);
	};

	return c;
};

module.exports = newDatabase;