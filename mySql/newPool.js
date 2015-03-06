var pools = require('../pools');
var promise = require('../table/promise');
var end = require('./pool/end');
var mysql = require('mysql');
var newId = require('../newId');
var negotiatePoolOptions = require('./pool/negotiatePoolOptions');

function newPool(connectionString, poolOptions) {
	var pool = mysql.createPool(connectionString);
	negotiatePoolOptions(pool, poolOptions);
	var id = newId();
	var boundEnd = end.bind(null, pool, id);
	var c = {};

	c.connect = pool.getConnection.bind(pool);
	c.end = promise.denodeify(boundEnd);
	pools[id] = c;
	return c;
}

module.exports = newPool;