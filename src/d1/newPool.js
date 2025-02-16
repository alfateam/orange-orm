const promisify = require('../promisify');
const pools = require('../pools');
const end = require('./pool/end');
const newGenericPool = require('./pool/newGenericPool');
const newId = require('../newId');

function newPool(d1Database, poolOptions) {
	var pool = newGenericPool(d1Database, poolOptions);
	var id = newId();
	var boundEnd = end.bind(null, pool, id);
	var c = {};

	c.connect = pool.connect;
	c.end = promisify(boundEnd);
	pools[id] = c;
	return c;
}

module.exports = newPool;