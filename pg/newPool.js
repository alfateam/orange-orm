var pools = require('../pools');
var promise = require('../table/promise');
var end = require('./pool/end');
var newPgPool = require('./pool/newPgPool');

function newPool(connectionString, poolOptions) {
	var pool = newPgPool(connectionString, poolOptions);
	var boundEnd = end.bind(null, connectionString, pool);
	var c = {};

	c.end = promise.denodeify(boundEnd);
	pools.push(c);

	return c;
}

module.exports = newPool;