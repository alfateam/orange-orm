var pg = require('pg');
var pools = require('../pools');
var negotiateConnectionString = require('./negotiateConnectionString');
var promise = require('../table/promise');
var end = require('./pool/end');

function newPool(connectionString) {
	connectionString = negotiateConnectionString(connectionString);
	var pool = pg.pools.getOrCreate(connectionString);
	var boundEnd = end.bind(null, connectionString, pool, pg);
	var c = {};

	c.end = promise.denodeify(boundEnd);
	pools.push(c);

	return c;
}

module.exports = newPool;