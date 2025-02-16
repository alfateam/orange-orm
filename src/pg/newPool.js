const promisify = require('../promisify');
const pools = require('../pools');
const end = require('./pool/end');
const newPgPool = require('./pool/newPgPool');
const newId = require('../newId');

function newPool(connectionString, poolOptions) {
	let pool = newPgPool(connectionString, poolOptions);
	let id = newId();
	let boundEnd = end.bind(null, pool, id);
	let c = {};

	c.connect = pool.connect;
	c.end = promisify(boundEnd);
	pools[id] = c;
	return c;
}

module.exports = newPool;