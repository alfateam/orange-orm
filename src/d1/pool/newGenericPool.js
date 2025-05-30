/* eslint-disable no-prototype-builtins */
var defaults = require('../../poolDefaults');
var genericPool = require('../../generic-pool');

function newGenericPool(d1Database, poolOptions) {
	poolOptions = poolOptions || {};
	// @ts-ignore
	var pool = genericPool.Pool({
		min: poolOptions.min || 0,
		max: 1,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log || defaults.poolLog,
		create: function(cb) {
			var client = {d1: d1Database, poolCount: 0};

			return cb(null, client);
		},

		destroy: function() {
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