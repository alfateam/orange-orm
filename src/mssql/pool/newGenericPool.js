// @ts-nocheck
/* eslint-disable no-prototype-builtins */

var defaults = require('../../poolDefaults');
var genericPool = require('../../generic-pool');
var mssql;

function newGenericPool(connectionString, poolOptions) {
	poolOptions = poolOptions || {};
	var pool = genericPool.Pool({
		min: poolOptions.min || 0,
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log || defaults.poolLog,
		create: async function(cb) {
			try {
				if (!mssql)
					mssql = await import('msnodesqlv8');
			}
			catch (err) {
				return cb(err, null);
			}
			var client;
			// const config = {
			// 	connectionString: connectionString,
			// 	options: {
			// 		useNumericString: true
			// 	}
			// };
			mssql.open(connectionString, onConnected);

			function onConnected(err, _client) {
				if(err)
					return cb(err, null);
				client = _client;
				// client.setUseNumericString(true);
				client.poolCount = 0;
				client.msnodesqlv8 = mssql;
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