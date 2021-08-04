var pools = require('../pools');
var promise = require('../table/promise');
var end = require('./pool/end');
var newPgPool = require('./pool/newPgPool');
var newId = require('../newId');

function newPool(connectionString, poolOptions) {
	var pool = newPgPool(connectionString, poolOptions);
	var id = newId();
	var boundEnd = end.bind(null, pool, id);
	var c = {};

	c.connect = pool.connect;
	c.end = promise.denodeify(boundEnd);
	pools[id] = c;
	return c;
}

module.exports = newPool;