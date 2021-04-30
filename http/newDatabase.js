let flags = require('../flags');

function newDatabase(connectionString) {
	flags.url = connectionString;
	let c = {};
	return c;
}

module.exports = newDatabase;
