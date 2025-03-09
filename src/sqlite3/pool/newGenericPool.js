/* eslint-disable no-prototype-builtins */
var defaults = require('../../poolDefaults');

var genericPool = require('../../generic-pool');
var sqlite;

function newGenericPool(connectionString, poolOptions) {
	poolOptions = poolOptions || {};
	var pool = genericPool.Pool({
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log || defaults.poolLog,
		create: async function(cb) {
			try {
				if (!sqlite)
					sqlite = await import('sqlite3');
			}
			catch (err) {
				return cb(err, null);
			}
			var client = new sqlite.Database(connectionString, onConnected);

			function onConnected(err) {
				if(err)
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