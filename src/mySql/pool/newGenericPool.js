// @ts-nocheck
/* eslint-disable no-prototype-builtins */
var defaults = require('../../poolDefaults');
var genericPool = require('../../generic-pool');
var mysql = require('mysql2');

function newGenericPool(connectionString, poolOptions) {
	if (typeof connectionString === 'string')
		connectionString = connectionString + '?dateStrings=true&decimalNumbers=true';
	else
		connectionString.dateStrings = true;
	poolOptions = poolOptions || {};
	var pool = genericPool.Pool({
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log,
		create: function(cb) {
			var innerPool = mysql.createPool(connectionString);
			return cb(null, innerPool);
			// innerPool.getConnection(onConnected);

			// function onConnected(err, client) {
			// 	console.dir('onConnected');
			// 	if(err)
			// 		return cb(err, null);
			// 	client.poolCount = 0;
			// 	return cb(null, client);
			// }
		},

		destroy: function(client) {
			client.poolCount = undefined;
			client.end();
		}
	});
	//monkey-patch with connect method
	pool.connect = function(cb) {
		pool.acquire(function(err, client) {
			if(err)  return cb(err, null, function() {/*NOOP*/});
			client.poolCount++;
			cb(null, client, function(err) {
				if(err) {
					pool.destroy(client);
				} else {
					pool.release(client);
				}
			});
		});
	};
	return pool;
}

module.exports = newGenericPool;