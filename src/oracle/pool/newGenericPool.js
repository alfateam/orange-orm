// @ts-nocheck
/* eslint-disable no-prototype-builtins */

var defaults = require('../../poolDefaults');
var genericPool = require('../../generic-pool');
var oracle;

function newGenericPool(connectionString, poolOptions) {
	poolOptions = poolOptions || {};
	var pool = genericPool.Pool({
		min: poolOptions.min || 0,
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log,
		create: async function(cb) {
			var client;
			try {
				if (!oracle) {
					oracle = await import('oracledb');
					oracle = oracle.default || oracle;
					oracle.outFormat = oracle.OUT_FORMAT_OBJECT;
					oracle.fetchAsBuffer = [ oracle.BLOB ];
				}
			}
			catch (err) {
				return cb(err, null);
			}
			oracle.getConnection(connectionString, onConnected);
			function onConnected(err, _client) {
				client = _client;
				if (err)
					return cb(err, null);
				client.poolCount = 0;
				return cb(null, client);
			}
		},

		destroy: function(client) {
			client.poolCount = undefined;
			client.close();
		}
	});
	//monkey-patch with connect method
	pool.connect = function(cb) {
		pool.acquire(function(err, client) {
			if (err) return cb(err, null, function() {/*NOOP*/ });
			client.poolCount++;
			cb(null, client, function(err) {
				if (err) {
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