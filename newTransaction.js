var pg = require('pg.js');
var begin = require('./table/begin');

function resolveTransaction(domain, connectionString) {
	domain.run(onRun);

	function onRun() {
		begin();
		pg.connect(connectionString, onConnected);
	}

	function onConnected(err, client, done) {

	}


	var c = {};
	

	return c;
};

module.exports = resolveTransaction;